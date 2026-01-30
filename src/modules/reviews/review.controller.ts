import { Request, Response } from "express";
import { reviewService } from "./review.service";
import { UserRole } from "../../middlewares/auth";

const createReview = async (req: Request, res: Response) => {
  const result = await reviewService.createReview({
    rating: req.body.rating,
    comment: req.body.comment,
    medicineId: req.body.medicineId,
    customerId: req.user?.id as string,
  });

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
};

const replyToReview = async (req: Request, res: Response) => {
  const result = await reviewService.replyToReview({
    parentId: req.params?.reviewId as string,
    comment: req.body.comment,
    sellerId: req.user?.id as string,
  });

  res.status(201).json({
    success: true,
    message: "Reply added successfully",
    data: result,
  });
};

/* -------- GET BY MEDICINE -------- */
const getReviewsByMedicine = async (req: Request, res: Response) => {
  const result = await reviewService.getReviewsByMedicine(
    req.params?.medicineId as string
  );

  res.json({
    success: true,
    data: result,
  });
};

const deleteReview = async (req: Request, res: Response) => {
  await reviewService.deleteReview(
    req.params.reviewId as string,
    req.user?.id as string,
    req.user?.role === UserRole.ADMIN
  );

  res.json({
    success: true,
    message: "Review deleted successfully",
  });
};

export const reviewController = {
  createReview,
  replyToReview,
  getReviewsByMedicine,
  deleteReview,
};
