import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { UserStatus } from "../../../generated/prisma/client";
import pageinationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";

// ================= GET ALL USERS =================
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, status } = req.query;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all users",
      });
    }

    const searchString = typeof search === "string" ? search : undefined;
    const roleParam = role as UserRole;
    const statusParam = status as UserStatus;

    const { page, limit, skip, sortBy, sortOrder } = pageinationSortingHelper(req.query);

    const result = await userService.getAllUsers({
      search: searchString,
      role: roleParam,
      status: statusParam,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.data,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET MY PROFILE =================
const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await userService.getMyProfile(userId);

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET USER BY ID =================
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    // Check if user is viewing their own profile or is admin
    if (!isAdmin && id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile",
      });
    }

    const result = await userService.getUserById(id as string);

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE USER =================
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, phone, address, image } = req.body;
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    // Validate input
    if (!name && !phone && !address && !image) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required for update",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (image !== undefined) updateData.image = image;

    const result = await userService.updateUser(
      id as string,
      updateData,
      requestingUserId!,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE USER STATUS =================
const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can update user status",
      });
    }

    if (!status || !Object.values(UserStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    const result = await userService.updateUserStatus(id as string, status, isAdmin);

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE USER ROLE =================
const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can update user role",
      });
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required",
      });
    }

    const result = await userService.updateUserRole(id as string, role, isAdmin);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE USER =================
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete users",
      });
    }

    await userService.deleteUser(id as string, isAdmin);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getDropDownSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const searchString = typeof search === 'string' ? search : undefined;
    const role = UserRole.SELLER;

    const result = await userService.dropDownSeller({ search: searchString, role });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET USER STATISTICS =================
const getUserStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view statistics",
      });
    }

    const result = await userService.getUserStatistics(isAdmin);

    res.status(200).json({
      success: true,
      message: "Statistics fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { name, phone, image, currentPassword, newPassword } = req.body;
        const user = (req as any).user;
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated" 
            });
        }

        if (user.id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only update your own profile" 
            });
        }

        const result = await userService.updateUserProfile(
            userId as string, 
            {
                name,
                phone,
                image,
                currentPassword,
                newPassword
            }, 
            req.headers 
        );

        return res.status(200).json(result);
        
    } catch (error: any) {
        return res.status(400).json({ 
            success: false, 
            message: error.message || "Failed to update profile" 
        });
    }
};

export const userController = {
  getAllUsers,
  getMyProfile,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStatistics,
  getDropDownSeller,
  updateProfile
};