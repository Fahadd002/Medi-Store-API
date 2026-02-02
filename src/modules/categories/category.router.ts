import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { CategoryController } from "./category.controller";
const router = express.Router();

router.get("/", CategoryController.getAllCategories)
router.get("/dropdown", CategoryController.getDropDownCategories)
router.get("/:categoryId", auth( UserRole.ADMIN), CategoryController.getCategoryById)
router.post("/", auth(UserRole.ADMIN), CategoryController.createCategory)
router.patch("/:categoryId", auth(UserRole.ADMIN), CategoryController.updateCategory)
router.delete("/:categoryId", auth(UserRole.ADMIN), CategoryController.deleteCategory)
export const categoryRouter: Router = router;