import * as jwt from "jsonwebtoken";
import * as type from "./types";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

export const signJwtAndReturnToken = async (user: type.IUser) => {
  try {
    return jwt.sign(
      {
        ...user,
        creationTime: new Date(),
      },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: "60d",
      }
    );
  } catch (err) {
    console.error(err);
  }
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY as string) as type.IUser;
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).end();
  }
  try {
    const user = verifyToken(token);
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(403).end();
  }
};
