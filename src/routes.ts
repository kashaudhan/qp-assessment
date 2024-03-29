import { Router } from "express";
import * as user from "./user";
import * as admin from "./admin";
import { authenticateToken } from "./auth";

const router = Router();

// common routes
router.get("/get-items", user.getItem);
router.post("/login", user.login);
router.post("/sign-in", user.signUp);

// user routes 
router.post("/user/add-to-cart", authenticateToken, user.addToCart);
router.get("/user/get-cart", authenticateToken, user.getCart);
router.post("/user/place-order", authenticateToken, user.placeOrder);

// admin routes
router.post("/admin/create-admin", authenticateToken,  admin.createAdmin);
router.post("/admin/add-item", authenticateToken, admin.insertItem);
router.post("/admin/add-multiple-items", authenticateToken, admin.bulkInsertItems);
router.post("/admin/update-item/:id", authenticateToken, admin.updateItem);
router.delete("/admin/delete-item/:id", authenticateToken, admin.deleteItem);

export default router;
