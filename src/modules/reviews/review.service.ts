import { prisma } from "../../lib/prisma";

const createReview = async (payload: {
  rating: number;
  comment?: string;
  customerId: string;
  medicineId: string;
  orderId?: string;
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

  if (payload.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: payload.orderId,
        customerId: payload.customerId,
        status: 'DELIVERED',
        items: {
          some: {
            medicineId: payload.medicineId,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Invalid order or medicine not found in order');
    }
  }

  const baseData = {
    rating: payload.rating,
    customerId: payload.customerId,
    medicineId: payload.medicineId,
  };

  return prisma.review.create({
    data: {
      ...baseData,
      ...(payload.comment ? { comment: payload.comment } : {}),
      ...(payload.orderId ? { orderId: payload.orderId } : {}),
    },
    include: {
      customer: {
        select: { id: true, name: true, image: true },
      },
      replies: {
        include: {
          seller: {
            select: { id: true, name: true, image: true },
          },
        },
      },
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
    include: {
      seller: {
        select: { id: true, name: true, image: true },
      },
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
        select: { id: true, name: true, image: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          seller: {
            select: { id: true, name: true, image: true },
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

const getMyReviews = async (customerId: string) => {
  return prisma.review.findMany({
    where: {
      customerId,
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      medicine: {
        select: {
          id: true,
          name: true,
        },
      },
      replies: {
        include: {
          seller: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });
};

const getReviewsToReply = async (sellerId: string) => {
  const sellerMedicines = await prisma.medicine.findMany({
    where: { sellerId },
    select: { id: true },
  });

  const medicineIds = sellerMedicines.map(medicine => medicine.id);
  return prisma.review.findMany({
    where: {
      medicineId: { in: medicineIds },
      parentId: null,
      replies: {
        none: {
          sellerId: sellerId, 
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, image: true },
      },
      medicine: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const getReviewStats = async (medicineId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      medicineId,
      parentId: null,
      rating: { not: null },
    },
    select: {
      rating: true,
    },
  });

  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const averageRating = totalRating / totalReviews;

  // Calculate rating distribution
  const ratingDistribution = {
    1: reviews.filter(r => r.rating === 1).length,
    2: reviews.filter(r => r.rating === 2).length,
    3: reviews.filter(r => r.rating === 3).length,
    4: reviews.filter(r => r.rating === 4).length,
    5: reviews.filter(r => r.rating === 5).length,
  };

  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalReviews,
    ratingDistribution,
  };
};

const checkReviewEligibility = async (payload: {
  orderId: string;
  medicineId: string;
  customerId: string;
}) => {
  const order = await prisma.order.findFirst({
    where: {
      id: payload.orderId,
      customerId: payload.customerId,
      status: 'DELIVERED', 
    },
    include: {
      items: {
        where: {
          medicineId: payload.medicineId,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found or not eligible for review');
  }

  if (order.items.length === 0) {
    throw new Error('Medicine not found in this order');
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      customerId: payload.customerId,
      medicineId: payload.medicineId,
      parentId: null,
    },
  });

  return {
    eligible: !existingReview,
    alreadyReviewed: !!existingReview,
    existingReview: existingReview ? {
      id: existingReview.id,
      rating: existingReview.rating,
      comment: existingReview.comment,
      createdAt: existingReview.createdAt,
    } : null,
  };
};

export const reviewService = {
  createReview,
  replyToReview,
  getReviewsByMedicine,
  deleteReview,
  getMyReviews,         
  getReviewsToReply,     
  getReviewStats,
  checkReviewEligibility,
};