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
  
  const totalAmount = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the order with generated UUID
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId,
        sellerId: payload.sellerId,
        shippingAddress: payload.shippingAddress,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        totalAmount,
        status: OrderStatus.PLACED,
      },
    });

    const orderItems = [];
    
    for (const item of payload.items) {
      const medicine = await tx.medicine.findFirst({
        where: {
          id: item.medicineId,
          sellerId: payload.sellerId,
          isActive: true,
        },
      });
      
      if (!medicine) {
        throw new Error(`Medicine ${item.medicineId} not found or not available from this seller`);
      }

      if (medicine.stock !== null && medicine.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`);
      }

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          price: item.price,
        },
      });

      if (medicine.stock !== null) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            stock: medicine.stock - item.quantity,
          },
        });        
      }

      orderItems.push(orderItem);
    }

    return {
      ...order,
      items: orderItems,
    };
  });

  return result;
};

const getMyOrders = async (customerId: string) => {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: { medicine: true },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getOrderById = async (orderId: string, userId: string) => {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: userId },
        { sellerId: userId },
      ],
    },
    include: {
      items: {
        include: { 
          medicine: {
            include: {
              reviews: {
                include: {
                  customer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  },
                  seller: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                },
                orderBy: {
                  createdAt: 'desc'
                }
              }
            }
          } 
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const cancelOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: userId },
        { sellerId: userId },
      ],
    },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  if (
    order.status === OrderStatus.SHIPPED ||
    order.status === OrderStatus.DELIVERED
  ) {
    throw new Error("Order cannot be cancelled as it's already shipped or delivered");
  }

  return await prisma.$transaction(async (tx) => {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: { medicine: true },
    });

    for (const item of orderItems) {
      if (item.medicine.stock !== null) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            stock: item.medicine.stock + item.quantity,
          },
        });
      }
    }

    // 3. Update order status to CANCELLED
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    return updatedOrder;
  });
};

const getSellerOrders = async (sellerId: string) => {
  return prisma.order.findMany({
    where: { sellerId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
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
    where: { 
      id: orderId, 
      sellerId,
      status: {
        not: OrderStatus.CANCELLED, // Cannot update cancelled orders
      }
    },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  // Validate status transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PLACED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new Error(`Invalid status transition from ${order.status} to ${status}`);
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
  getSellerOrders,
  updateOrderStatus,
};