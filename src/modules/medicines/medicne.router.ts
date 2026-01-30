import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { MedicineController } from "./medicne.controller";
const router = express.Router();

router.get("/", MedicineController.getAllMedicines)
router.get("/:medicineId", auth(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN), MedicineController.getMedicineById)
router.get("/myMedicines", MedicineController.getMyAddedMedicines)
router.post("/", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.addMedicine)
router.patch("/:medicineId", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.updateMedicine)
router.delete("/:medicineId", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.deleteMedicine)

export const medicineRouter: Router = router;