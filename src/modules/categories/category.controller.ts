import { NextFunction, Request, Response } from "express";
import { categoryService } from "./category.service";
import pageinationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: "Only admin can create category"
      });
    }

    const result = await categoryService.createCategory(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query
        const searchString = typeof search === 'string' ? search : undefined

        const { page, limit, skip, sortBy, sortOrder } = pageinationSortingHelper(req.query)

        const result = await categoryService.getAllCategories({ search: searchString, page, limit, skip, sortBy, sortOrder })
        res.status(200).json(result)
    } catch (e) {
         next(e)
    }
}

/**
 * Get category by ID
 */
const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new Error("Category id is required");
    }

    const result = await categoryService.getCategoryById(categoryId as string);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/**
 * Update category (Admin only)
 */
const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("You are not authorized");
    }

    const { categoryId } = req.params;
    const result = await categoryService.updateCategory(categoryId as string, req.body);

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/**
 * Delete category (Admin only)
 */
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("You are not authorized");
    }

    const { categoryId } = req.params;
    const result = await categoryService.deleteCategory(categoryId as string);

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/**
 * Category statistics (Admin dashboard)
 */
const getCategoryStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("You are not authorized");
    }

    const result = await categoryService.getCategoryStats();
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

export const getDropDownCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const categories = await categoryService.dropDownCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getDropDownCategories
};
