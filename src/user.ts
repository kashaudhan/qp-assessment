import { Request, Response } from "express";
import * as db from "./db";
import pgPromise from "pg-promise";
import * as validator from "./validator";
import bcrypt from "bcryptjs";
import * as auth from "./auth";
import * as type from "./types";

const pgp = pgPromise({
  capSQL: true,
});

export const signUp = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (
    !validator.emailValidation(email) ||
    !validator.passwordValidation(password)
  ) {
    return res.status(400).json({
      error: "Email or password is invalid",
    });
  }

  const salt = bcrypt.genSaltSync(Number(process.env.ENCRYPTION_SALT));
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    await db.query(
      `
      --sql
        INSERT INTO accounts(email, password, role)
        VALUES($1, $2, 'USER')
    `,
      [email, passwordHash]
    );

    return res.status(200).json({
      message: "User created successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email: emailId = "", password = "" } = req.body;

  if (!emailId.trim() || !password.trim()) {
    return res
      .status(403)
      .json({
        error: "Email or password not provided",
      })
      .end();
  }

  try {
    const result = await db.query(
      `
      --sql
      SELECT * from accounts WHERE email = $1
    `,
      [emailId]
    );
    if (!result.rowCount) {
      return res
        .status(401)
        .json({
          error: "Invalid email provided",
        })
        .end();
    }
    const isPasswordValid = bcrypt.compareSync(
      password,
      result.rows[0].password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({
          error: "Email or password is invalid",
        })
        .end();
    }

    const { id, email, role, last_login }: type.IUser = result.rows[0];
    const token = await auth.signJwtAndReturnToken({
      id,
      email,
      role,
      last_login,
    });
    console.log("Token: ", token);

    return res
      .status(200)
      .json({
        data: token,
      })
      .end();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Something went wrong",
      })
      .end();
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (
    !validator.emailValidation(email) ||
    !validator.passwordValidation(password)
  ) {
    return res.status(400).json({
      error: "Email or password is invalid",
    });
  }

  const salt = bcrypt.genSaltSync(Number(process.env.ENCRYPTION_SALT));
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    await db.query(
      `
      --sql
        INSERT INTO accounts(email, password, role)
        VALUES($1, $2, 'USER')
    `,
      [email, passwordHash]
    );

    return res.status(200).json({
      message: "User created successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
};

export const getItem = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      --sql
      SELECT id, price, count, category, name from items WHERE is_deleted <> true
    `);
    return res
      .status(200)
      .json({
        data: result.rows,
      })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};
export const addToCart = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { id: userId } = (req as any).user;

  try {
    await db.query(
      `
      --sql
      INSERT INTO cart
        (item_id, user_id)
      VALUES
        ($1, $2)
    `,
      [itemId, userId]
    );
    return res.status(200).json({
      message: "Item added to cart",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

export const getCart = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;

  try {
    const cart = await db.query(
      `
      --sql
      SELECT * FROM cart
      WHERE user_id = $1
    `,
      [userId]
    );

    if (!cart.rowCount) {
      res.status(500).json({
        error: "No items in cart",
      });
    }

    const itemIds = cart.rows.map((item) => item.item_id);

    const result = await db.query(
      `
      --sql
      SELECT * FROM items
      WHERE id = ANY($1::int[])
    `,
      [itemIds]
    );

    return res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
};

export const placeOrder = async (req: Request, res: Response) => {
  /**
   * 1. Get cart item
   * 2. Git item detail
   * 3. Insert a row with user_id & total amount
   * 4. Insert cart items into order_item with order_id
   * 5. Delete cart items
   */

  const { id: userId } = (req as any).user;

  const client = await db.client();
  if (!client) {
    return res.status(500).end();
  }

  try {
    client.query("BEGIN");
    // Start db transaction

    const cart = await db.query(
      `
      --sql
      SELECT * FROM cart
      WHERE user_id = $1
    `,
      [userId]
    );

    if (!cart.rowCount) {
      throw new Error("No items in cart");
    }

    const itemIds = cart.rows.map((item) => item.item_id);

    const itemDetail = await db.query(
      `
      --sql
      SELECT * FROM items
      WHERE id = ANY($1::int[])
    `,
      [itemIds]
    );

    if (!itemDetail.rowCount) {
      throw new Error("Items not found");
    }

    const itemTotal: number = itemDetail.rows.reduce(
      (total, item) => total + Number(item.price),
      0
    );

    const order = await db.query(
      `
      --sql
      INSERT INTO orders
        (user_id, amount)
      VALUES
        ($1, $2)
      RETURNING id
    `,
      [userId, itemTotal]
    );

    if (!order.rowCount) {
      throw new Error("Failed to create order");
    }

    // Bulk insert items in order_item
    const orderItemRows = itemDetail.rows.map((item) => {
      return {
        order_id: order.rows[0].id,
        item_id: item.id,
        item_name: item.name,
        item_price: item.price,
      };
    });
    const columnSet = new pgp.helpers.ColumnSet(
      ["order_id", "item_id", "item_name", "item_price"],
      {
        table: "order_item",
      }
    );

    const orderItemBulkInsert = pgp.helpers.insert(orderItemRows, columnSet);

    await db.query(orderItemBulkInsert);

    await db.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);

    client.query("COMMIT");
    res.status(200).json({
      message: "Order placed successfully"
    }).end();
  } catch (error) {
    console.error(error);
    client.query("ROLLBACK");
    res.status(500).json({
      error: "Something went wrong",
    }).end();
  }
};
