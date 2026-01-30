import { OrderStatus, PaymentMethod } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createOrder = async (
  customerId: string,
  payload: {
    sellerId: string;
    shippingAddress: string;
    items: {
      medicineId: string;
      quantity: number;
      price: number;
    }[];
  }
) => {
  const totalAmount = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      customerId,
      sellerId: payload.sellerId,
      shippingAddress: payload.shippingAddress,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      totalAmount,
      items: {
        create: payload.items,
      },
    },
    include: {
      items: true,
    },
  });

  return order;
};

const getMyOrders = async (customerId: string) => {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: { medicine: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getOrderById = async (orderId: string, customerId: string) => {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
    include: {
      items: {
        include: { medicine: true },
      },
    },
  });
};

const cancelOrder = async (orderId: string, customerId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (
    order.status === OrderStatus.SHIPPED ||
    order.status === OrderStatus.DELIVERED
  ) {
    throw new Error("Order cannot be cancelled");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED },
  });
};

const getSellerOrders = async (sellerId: string) => {
  return prisma.order.findMany({
    where: { sellerId },
    include: {
      customer: true,
      items: {
        include: { medicine: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateOrderStatus = async (
  orderId: string,
  sellerId: string,
  status: OrderStatus
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};


export const orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
   // seller
  getSellerOrders,
  updateOrderStatus
};
