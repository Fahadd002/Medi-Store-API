import { prisma } from "../../lib/prisma";
import { Medicine, Prisma } from "../../../generated/prisma/client";

const addMedicine = async (
  data: Omit<Medicine, "id" | "createdAt" | "updatedAt" | "sellerId" | "isActive" | "stock">,
  userId: string
) => {
  return await prisma.medicine.create({
    data: {
      ...data,
      sellerId: userId,
    },
  });
};

const getAllMedicines = async ({
  search,
  categoryId,
  sellerId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
  isActive,
}: {
  search: string | undefined;
  sellerId: string | undefined;
  categoryId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
  isActive: boolean | undefined;
}) => {
  const andConditions: Prisma.MedicineWhereInput[] = [];

  if (isActive === true) {
    andConditions.push({ isActive: true });
  }

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (sellerId) {
    andConditions.push({ sellerId });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
    }),
    prisma.medicine.count({
      where: { AND: andConditions },
    }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getMyAddedMedicines = async ({
  search,
  categoryId,
  sellerId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
}: {
  search: string | undefined;
  sellerId: string;
  categoryId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: Prisma.MedicineWhereInput[] = [];
  andConditions.push({ sellerId });

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
    }),
    prisma.medicine.count({
      where: { AND: andConditions },
    }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
};


const getMedicineById = async (medicineId: string) => {
  try {
    const medicine = await prisma.medicine.findUniqueOrThrow({
      where: { id: medicineId },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          },
        },
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                image: true
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    const averageRating = medicine.reviews.length > 0
      ? medicine.reviews.reduce((sum, review) => sum + (review?.rating || 0), 0) / medicine.reviews.length
      : 0;
    const ratingDistribution = {
      5: medicine.reviews.filter(r => r.rating === 5).length,
      4: medicine.reviews.filter(r => r.rating === 4).length,
      3: medicine.reviews.filter(r => r.rating === 3).length,
      2: medicine.reviews.filter(r => r.rating === 2).length,
      1: medicine.reviews.filter(r => r.rating === 1).length,
    };

    return {
      success: true,
      data: {
        ...medicine,
        averageRating,
        ratingDistribution,
      }
    };
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    return {
      success: false,
      error: 'Failed to fetch medicine details'
    };
  }
}

const updateMedicine = async (
  medicineId: string,
  data: Partial<Medicine>,
  sellerId: string,
  isAdmin: boolean
) => {
  const medicine = await prisma.medicine.findUniqueOrThrow({
    where: { id: medicineId },
    select: { sellerId: true },
  });

  if (!isAdmin && medicine.sellerId !== sellerId) {
    throw new Error("You are not owner of this medicine");
  }

  return await prisma.medicine.update({
    where: { id: medicineId },
    data,
  });
};

const deleteMedicine = async (
  medicineId: string,
  sellerId: string,
  isAdmin: boolean
) => {
  const medicine = await prisma.medicine.findUniqueOrThrow({
    where: { id: medicineId },
    select: { sellerId: true },
  });

  if (!isAdmin && medicine.sellerId !== sellerId) {
    throw new Error("You are not owner of this medicine");
  }

  return await prisma.medicine.delete({
    where: { id: medicineId },
  });
};

export const medicineService = {
  addMedicine,
  getAllMedicines,
  getMyAddedMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};
