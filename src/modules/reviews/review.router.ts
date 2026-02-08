import { Router } from "express";
import { reviewController } from "./review.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

router.post("/", auth(UserRole.CUSTOMER), reviewController.createReview);
router.post("/:reviewId/reply", auth(UserRole.SELLER), reviewController.replyToReview);
router.get("/medicine/:medicineId", reviewController.getReviewsByMedicine);
router.delete("/:reviewId", auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER), reviewController.deleteReview);
router.get("/my-reviews", auth(UserRole.CUSTOMER), reviewController.getMyReviews);
router.get("/seller/pending", auth(UserRole.SELLER), reviewController.getReviewsToReply);
router.get("/stats/:medicineId", reviewController.getReviewStats);

export default router;