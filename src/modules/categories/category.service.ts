import { Prisma, Category } from "../../../generated/prisma/client";
/**
 * Create Category (Admin only)
 */
const createCategory = async (
  data: Omit<Category, "id" | "createdAt" | "updatedAt">
) => {
  const result = await prisma.category.create({
    data
  });

  return result;
};
import { CategoryWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

const getAllCategories = async ({
  search,
  page,
  limit,
  skip,
  sortBy,
  sortOrder
}: {
  search: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: CategoryWhereInput[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  const prismaSortOrder: Prisma.SortOrder = sortOrder === "asc" ? "asc" : "desc";

  const categories = await prisma.category.findMany({
    take: limit,
    skip,
    where: { AND: andConditions },
    orderBy: {
      [sortBy]: prismaSortOrder
    },
    include: {
      _count: {
        select: { medicines: true }
      }
    }
  });

  const total = await prisma.category.count({
    where: {
      AND: andConditions
    }
  });

  return {
    data: categories,
    pagination: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  };
};

const getCategoryById = async (id: string) => {
  return await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      medicines: {
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          stock: true
        }
      }
    }
  });
};

const updateCategory = async (
  id: string,
  data: Partial<Category>
) => {
  await prisma.category.findUniqueOrThrow({
    where: { id }
  });

  const result = await prisma.category.update({
    where: { id },
    data
  });

  return result;
};


const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      _count: {
        select: {
          medicines: true
        }
      }
    }
  });

  if (category._count.medicines > 0) {
    throw new Error("Cannot delete category with existing medicines");
  }

  return await prisma.category.delete({
    where: { id }
  });
};


const getCategoryStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [totalCategories, totalMedicines] = await Promise.all([
      tx.category.count(),
      tx.medicine.count()
    ]);

    return {
      totalCategories,
      totalMedicines
    };
  });
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats
};
