import express, { Router } from "express";
import { OrderController } from "./order.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth(UserRole.CUSTOMER), OrderController.createOrder);
router.get("/my-orders", auth(UserRole.CUSTOMER), OrderController.getMyOrders);
router.get("/:orderId", auth(UserRole.CUSTOMER), OrderController.getOrderById);
router.patch("/:orderId/cancel", auth(UserRole.CUSTOMER), OrderController.cancelOrder);

router.get("/seller/orders",auth(UserRole.SELLER),OrderController.getSellerOrders);
router.patch("/seller/orders/:orderId/status", auth(UserRole.SELLER), OrderController.updateOrderStatus);

export const orderRouter: Router = router;
