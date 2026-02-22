import { Request, Response, NextFunction } from "express";
import { orderService } from "./order.service";
import { OrderStatus } from "../../../generated/prisma/enums";
import pageinationSortingHelper from "../../helpers/paginationSortingHelper";

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const result = await orderService.createOrder(user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sellerId, status, search } = req.query;
    const searchString = typeof search === "string" ? search : undefined;
    const seller = typeof sellerId === "string" ? sellerId : undefined;
    const statusValue = typeof status === "string" ? status as OrderStatus : undefined;

    const { page, limit, skip, sortBy, sortOrder } = pageinationSortingHelper(req.query);
    const result = await orderService.getAllOrders({
      sellerId: seller,
      status: statusValue,
      search: searchString,
      page,
      limit,
      skip,
      sortBy,
      sortOrder
    });

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const result = await orderService.getMyOrders(user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const { orderId } = req.params;
    const result = await orderService.getOrderById(orderId as string, user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const { orderId } = req.params;
    const result = await orderService.cancelOrder(orderId as string, user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const getSellerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const result = await orderService.getSellerOrders(user.id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new Error("Unauthorized");

    const { orderId } = req.params;
    const { status } = req.body;

    const result = await orderService.updateOrderStatus(
      orderId as string,
      user.id,
      status as OrderStatus
    );

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

export const OrderController = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
  getAllOrders
};
