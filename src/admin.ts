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

  if(role !== 'ADMIN') {
    return res.status(401).end();
  }

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
        VALUES($1, $2, 'ADMIN')
    `,
      [email, passwordHash]
    );

    return res.status(200).json({
      message: "Admin created successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
};

export const insertItems = (req: Request, res: Response) => {
  const { role } = (req as any).user;

  if(role !== 'ADMIN') {
    return res.status(401).end();
  }
  if (
    !req.body.name ||
    !req.body.price ||
    !req.body.count ||
    !req.body.category
  ) {
    return res.status(400).json({
      message: "Please provide all required item detail",
    });
  }

  const { name, price, count, category }: types.IItem = req.body;

  try {
    const result = db.query(
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

export const updateItem = async (req: Request, res: Response) => {

  const { role } = (req as any).user;

  if(role !== 'ADMIN') {
    return res.status(401).end();
  }

  const { id } = req.params;

  const { name, price, count, category } = req.body as types.IItem;

  try {
    const result = await db.query(
      `
      --sql
      UPDATE items
      SET
        name = $2,
        price = $3,
        count = $4,
        category = $5
      WHERE
        id = $1
    `,
      [id, name, price, count, category]
    );

    if (!result) {
      throw new Error("Something went wrong");
    }

    return res.status(200).json({
      message: "Item updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};

export const deleteItem = async (req: Request, res: Response) => {

  const { role } = (req as any).user;

  if(role !== 'ADMIN') {
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
    return res.status(200).json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};
