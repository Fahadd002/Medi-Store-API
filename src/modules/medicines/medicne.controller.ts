import { NextFunction, Request, Response } from "express";
import pageinationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";
import { medicineService } from "./medicne.service";

const addMedicine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        error: "Unauthorized!",
      });
    }

    const medicineData = {
      ...req.body,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
    };

    const result = await medicineService.addMedicine(medicineData, user.id as string);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const getAllMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, categoryId, sellerId, isActive } = req.query;

    const searchString = typeof search === "string" ? search : undefined;
    const category = typeof categoryId === "string" ? categoryId : undefined;
    const seller = typeof sellerId === "string" ? sellerId : undefined;
    
    // Fix: Parse isActive only if it's a string
    const isActiveValue = typeof isActive === "string" 
      ? isActive === "true" 
        ? true 
        : isActive === "false" 
          ? false 
          : undefined
      : undefined;

    const { page, limit, skip, sortBy, sortOrder } = pageinationSortingHelper(req.query);

    const result = await medicineService.getAllMedicines({
      search: searchString,
      categoryId: category,
      sellerId: seller,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      isActive: isActiveValue
    });

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
/* ================= UPDATE MEDICINE ================= */
const updateMedicine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are not authorized");
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const { medicineId } = req.params;

    // Convert expiryDate string to Date object if provided
    const updateData = { ...req.body };
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }

    const result = await medicineService.updateMedicine(
      medicineId as string,
      updateData,
      user.id,
      isAdmin
    );

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const getMedicineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicineId } = req.params;
    if (!medicineId) {
      throw new Error("Medicine Id required");
    }

    const result = await medicineService.getMedicineById(medicineId as string);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const getMyAddedMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("Unauthorized!");
    }

    const { search, categoryId } = req.query;

    const searchString = typeof search === "string" ? search : undefined;
    const category = typeof categoryId === "string" ? categoryId : undefined;

    const { page, limit, skip, sortBy, sortOrder } = pageinationSortingHelper(req.query);

    const result = await medicineService.getMyAddedMedicines({
      search: searchString,
      categoryId: category,
      sellerId: user.id,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    });

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const deleteMedicine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are not authorized");
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const { medicineId } = req.params;

    const result = await medicineService.deleteMedicine(
      medicineId as string,
      user.id,
      isAdmin
    );

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/* ================= EXPORT ================= */
export const MedicineController = {
  addMedicine,
  getAllMedicines,
  getMedicineById,
  getMyAddedMedicines,
  updateMedicine,
  deleteMedicine,
};