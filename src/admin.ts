import { Request, Response } from "express";
import * as db from "./db";
import * as validator from "./validator";
import bcrypt from "bcryptjs";
import pgPromise from "pg-promise";
import * as types from "./types";

const pgp = pgPromise({
  capSQL: true,
});

export const createAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { role } = (req as any).user;

  if (role !== "ADMIN") {
    return res.status(401).end();
  }

  if (
    !validator.emailValidation(email) ||
    !validator.passwordValidation(password)
  ) {
    return res
      .status(400)
      .json({
        error: "Email or password is invalid",
      })
      .end();
  }

  const salt = bcrypt.genSaltSync(Number(process.env.ENCRYPTION_SALT));
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    await db.query(
      `
      --sql
        INSERT INTO accounts(email, password, role)
        VALUES($1, $2, 'ADMIN')
    `,
      [email, passwordHash]
    );

    return res
      .status(200)
      .json({
        message: "Admin created successfully!",
      })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};

export const insertItem = async (req: Request, res: Response) => {
  const { role } = (req as any).user;

  if (role !== "ADMIN") {
    return res.status(401).end();
  }
  if (
    !req.body.name ||
    !req.body.price ||
    !req.body.count ||
    !req.body.category
  ) {
    return res
      .status(400)
      .json({
        message: "Please provide all required item detail",
      })
      .end();
  }

  const { name, price, count, category }: types.IItem = req.body;

  try {
    await db.query(
      `
      --sql
      INSERT INTO items
      (name, price, count, category)
      VALUES
      ($1, $2, $3, $4)
    `,
      [name, price, count, category]
    );
    return res
      .status(200)
      .json({
        message: "Item added to inventory",
      })
      .end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        error: "Something went wrong",
      })
      .end();
  }
};

export const bulkInsertItems = async (req: Request, res: Response) => {
  const { role } = (req as any).user;

  if (role !== "ADMIN") {
    return res.status(401).end();
  }

  const data = req.body;

  if (!Array.isArray(data)) {
    return res
      .status(422)
      .json({
        error: "Invalid data format",
      })
      .end();
  }

  try {
    const columnSet = new pgp.helpers.ColumnSet(
      ["name", "price", "count", "category"],
      {
        table: "items",
      }
    );

    const insertItems = pgp.helpers.insert(data, columnSet);

    await db.query(insertItems);

    return res
      .status(200)
      .json({
        message: "Items inserted successfully",
      })
      .end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        error: "Something went wrong",
      })
      .end();
  }
};

export const updateItem = async (req: Request, res: Response) => {
  const { role } = (req as any).user;

  if (role !== "ADMIN") {
    return res.status(401).end();
  }

  const { id } = req.params;

  const { name, price, count, category, is_deleted } = req.body as types.IItem;

  try {
    const result = await db.query(
      `
      --sql
      UPDATE items
      SET
        name = $2,
        price = $3,
        count = $4,
        category = $5,
        is_deleted = $6
      WHERE
        id = $1
    `,
      [id, name, price, count, category, is_deleted]
    );

    if (!result) {
      throw new Error("Something went wrong");
    }

    return res
      .status(200)
      .json({
        message: "Item updated successfully!",
      })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const { role } = (req as any).user;

  if (role !== "ADMIN") {
    return res.status(401).end();
  }

  const { id } = req.params;

  try {
    await db.query(
      `
      --sql
      UPDATE items
      SET
        is_deleted = true
      WHERE
        id = $1
    `,
      [id]
    );
    return res
      .status(200)
      .json({
        message: "Item deleted successfully",
      })
      .end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};
