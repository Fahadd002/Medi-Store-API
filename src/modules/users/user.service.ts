import { prisma } from "../../lib/prisma";
import { User, Prisma, Role, UserStatus } from "../../../generated/prisma/client";
import { UserRole } from "../../middlewares/auth";
import { DropDown } from "../../types/dropdown.type";
import { auth } from "../../lib/auth";

const getAllUsers = async ({
  search,
  role,
  status,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
}: {
  search: string | undefined;
  role: Role | undefined;
  status: UserStatus | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: Prisma.UserWhereInput[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      take: limit,
      skip,
      where: { AND: andConditions },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({
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

const dropDownSeller = async ({ search, role }: { search: string | undefined, role: UserRole }): Promise<DropDown[]> => {
  const andConditions: Prisma.UserWhereInput[] = [];
  andConditions.push({ role })
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  const users = await prisma.user.findMany({
    where: { AND: andConditions },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return users.map((users) => ({
    value: users.id,
    label: users.name,
  }));
};


const getMyProfile = async (userId: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const getUserById = async (userId: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// ================= UPDATE USER =================
const updateUser = async (
  userId: string,
  data: Partial<User>,
  requestingUserId: string,
  isAdmin: boolean
) => {
  if (!isAdmin && userId !== requestingUserId) {
    throw new Error("You are not authorized to update this user");
  }

  if (!isAdmin) {
    const allowedFields = ["name", "phone", "address", "image"];
    const disallowedFields = Object.keys(data).filter(
      (key) => !allowedFields.includes(key)
    );

    if (disallowedFields.length > 0) {
      throw new Error(`You cannot update: ${disallowedFields.join(", ")}`);
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      emailVerified: true,
      image: true,
      updatedAt: true,
    },
  });
};

// ================= UPDATE USER STATUS (Admin only) =================
const updateUserStatus = async (
  userId: string,
  status: UserStatus,
  isAdmin: boolean
) => {
  if (!isAdmin) {
    throw new Error("Only admin can update user status");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

// ================= UPDATE USER ROLE (Admin only) =================
const updateUserRole = async (
  userId: string,
  role: Role,
  isAdmin: boolean
) => {
  if (!isAdmin) {
    throw new Error("Only admin can update user role");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

// ================= DELETE USER (Admin only) =================
const deleteUser = async (
  userId: string,
  isAdmin: boolean
) => {
  if (!isAdmin) {
    throw new Error("Only admin can delete users");
  }

  return await prisma.user.delete({
    where: { id: userId },
  });
};


const getUserStatistics = async (isAdmin: boolean) => {
  if (!isAdmin) {
    throw new Error("Only admin can view statistics");
  }

  const [
    totalUsers,
    totalCustomers,
    totalSellers,
    totalAdmins,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    inactiveUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.SELLER } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { status: UserStatus.BANNED } }),
    prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
  ]);

  return {
    total: totalUsers,
    customers: totalCustomers,
    sellers: totalSellers,
    admins: totalAdmins,
    active: activeUsers,
    suspended: suspendedUsers,
    banned: bannedUsers,
    inactive: inactiveUsers,
  };
};

const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    phone?: string;
    image?: string;
    currentPassword?: string;
    newPassword?: string;
  },
  headers: any 
) => {
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error("Current password is required");
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        headers: headers, 
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to change password");
    }
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.image) updateData.image = data.image;

  if (Object.keys(updateData).length > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    };
  }

  return {
    success: true,
    message: data.newPassword ? "Password changed successfully" : "No changes made",
    data: null
  };
};

export const userService = {
  getAllUsers,
  getMyProfile,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStatistics,
  dropDownSeller,
  updateUserProfile
};