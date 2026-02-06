import express, { Router } from "express";
import { OrderController } from "./order.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER), OrderController.createOrder);
router.get("/my-orders", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER), OrderController.getMyOrders);
router.get("/:orderId", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER), OrderController.getOrderById);
router.patch("/:orderId/cancel", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER), OrderController.cancelOrder);

router.get("/seller/orders",auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER),OrderController.getSellerOrders);
router.patch("/seller/orders/:orderId/status", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SELLER), OrderController.updateOrderStatus);

export const orderRouter: Router = router;
