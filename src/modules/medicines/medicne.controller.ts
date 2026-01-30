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

    const result = await medicineService.addMedicine(req.body, user.id as string);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const getAllMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, categoryId, sellerId } = req.query;

    const searchString = typeof search === "string" ? search : undefined;
    const category = typeof categoryId === "string" ? categoryId : undefined;
    const seller = typeof sellerId === "string" ? sellerId : undefined;

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
    });

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/* ================= GET MEDICINE BY ID ================= */
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

/* ================= GET MY MEDICINES (SELLER) ================= */
const getMyAddedMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("Unauthorized!");
    }

    const result = await medicineService.getMyAddedMedicines(user.id);
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

    const result = await medicineService.updateMedicine(
      medicineId as string,
      req.body,
      user.id,
      isAdmin
    );

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
