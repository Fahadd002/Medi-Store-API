import { prisma } from "../../lib/prisma";
import { Medicine, Prisma } from "../../../generated/prisma/client";

const addMedicine = async (
  data: Omit<Medicine, "id" | "createdAt" | "updatedAt" | "sellerId">,
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
}: {
  search: string | undefined;
  sellerId: string | undefined;
  categoryId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: Prisma.MedicineWhereInput[] = [];

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

const getMyAddedMedicines = async (sellerId: string) => {
  return await prisma.medicine.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { reviews: true },
      },
    },
  });
};

const getMedicineById = async (medicineId: string) => {
  return await prisma.medicine.findUniqueOrThrow({
    where: { id: medicineId },
    include: {
      category: true,
      seller: {
        select: { id: true, name: true },
      },
      reviews: {
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { reviews: true },
      },
    },
  });
};

/* ================= UPDATE MEDICINE ================= */
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

/* ================= DELETE MEDICINE ================= */
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
