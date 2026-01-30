import { prisma } from "../../lib/prisma";

const createReview = async (payload: {
  rating: number;
  comment?: string;
  customerId: string;
  medicineId: string;
}) => {
  const exists = await prisma.review.findFirst({
    where: {
      customerId: payload.customerId,
      medicineId: payload.medicineId,
      parentId: null,
    },
  });

  if (exists) {
    throw new Error("You already reviewed this medicine");
  }

  return prisma.review.create({
    data: {
      rating: payload.rating,
      customerId: payload.customerId,
      medicineId: payload.medicineId,
      ...(payload.comment !== undefined && { comment: payload.comment }),
    },
  });
};

const replyToReview = async (payload: {
  parentId: string;
  comment: string;
  sellerId: string;
}) => {
  const parentReview = await prisma.review.findUniqueOrThrow({
    where: { id: payload.parentId },
    include: { medicine: true },
  });

  if (parentReview.medicine.sellerId !== payload.sellerId) {
    throw new Error("You are not allowed to reply to this review");
  }

  return prisma.review.create({
    data: {
      comment: payload.comment,
      sellerId: payload.sellerId,
      parentId: payload.parentId,
      medicineId: parentReview.medicineId,
    },
  });
};

const getReviewsByMedicine = async (medicineId: string) => {
  return prisma.review.findMany({
    where: {
      medicineId,
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          seller: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
};

const deleteReview = async (
  reviewId: string,
  userId: string,
  isAdmin: boolean
) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
  });

  if (
    !isAdmin &&
    review.customerId !== userId &&
    review.sellerId !== userId
  ) {
    throw new Error("Unauthorized");
  }

  return prisma.review.delete({
    where: { id: reviewId },
  });
};

export const reviewService = {
  createReview,
  replyToReview,
  getReviewsByMedicine,
  deleteReview,
};
