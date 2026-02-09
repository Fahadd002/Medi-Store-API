import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { MedicineController } from "./medicne.controller";
const router = express.Router();

router.get("/", MedicineController.getAllMedicines)
router.get("/myMedicines", auth(UserRole.SELLER), MedicineController.getMyAddedMedicines)
router.get("/:medicineId", MedicineController.getMedicineById)
router.post("/", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.addMedicine)
router.patch("/:medicineId", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.updateMedicine)
router.delete("/:medicineId", auth(UserRole.SELLER, UserRole.ADMIN), MedicineController.deleteMedicine)

export const medicineRouter: Router = router;