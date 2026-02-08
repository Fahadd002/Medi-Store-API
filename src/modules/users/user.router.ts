import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { userController } from "./user.controller";
const router = express.Router();

router.get("/seller-dropdown", userController.getDropDownSeller);

router.get("/profile", auth(), userController.getMyProfile);

router.get("/stats", auth(UserRole.ADMIN), userController.getUserStatistics);

router.get("/", auth(UserRole.ADMIN), userController.getAllUsers);

router.get("/:id", auth(), userController.getUserById);

router.patch("/:id", auth(), userController.updateUser);

router.patch("/:id/status", auth(UserRole.ADMIN), userController.updateUserStatus);
router.patch("/:id/role", auth(UserRole.ADMIN), userController.updateUserRole);
router.delete("/:id", auth(UserRole.ADMIN), userController.deleteUser);

export const userRouter: Router = router;