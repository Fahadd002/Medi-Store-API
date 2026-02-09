import { Request, Response } from "express";
import { reviewService } from "./review.service";
import { UserRole } from "../../middlewares/auth";

const createReview = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.createReview({
      rating: req.body.rating,
      comment: req.body.comment,
      medicineId: req.body.medicineId,
      customerId: req.user?.id as string,
      orderId: req.body.orderId, // Add orderId from request body
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create review",
    });
  }
};

const replyToReview = async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reply to review",
    });
  }
};

const getReviewsByMedicine = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getReviewsByMedicine(
      req.params?.medicineId as string
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch reviews",
    });
  }
};

const deleteReview = async (req: Request, res: Response) => {
  try {
    await reviewService.deleteReview(
      req.params.reviewId as string,
      req.user?.id as string,
      req.user?.role === UserRole.ADMIN
    );

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete review",
    });
  }
};

const getMyReviews = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getMyReviews(
      req.user?.id as string
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch your reviews",
    });
  }
};

const getReviewsToReply = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getReviewsToReply(
      req.user?.id as string
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch reviews to reply",
    });
  }
};

const getReviewStats = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getReviewStats(
      req.params.medicineId as string
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch review statistics",
    });
  }
};


const checkReviewEligibility = async (req: Request, res: Response) => {
  try {
    const params = req.params as { orderId: string; medicineId: string };
    const { orderId, medicineId } = params;
    const customerId = req.user?.id as string;

    if (!orderId || !medicineId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Medicine ID are required",
      });
    }

    const result = await reviewService.checkReviewEligibility({
      orderId,
      medicineId,
      customerId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to check review eligibility",
    });
  }
};

export const reviewController = {
  createReview,
  replyToReview,
  getReviewsByMedicine,
  deleteReview,
  getMyReviews,
  getReviewsToReply,
  getReviewStats,
  checkReviewEligibility, 
};