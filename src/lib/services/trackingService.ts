import { prisma } from "../prisma";
import { sendOrderNotification } from "./notificationService";
import { autoAssignOrder } from "./assignmentEngine";

export type OrderStatus =
  | "DRAFT"
  | "PLACED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RESCHEDULED"
  | "CANCELLED";

export interface LogStatusChangeParams {
  orderId: string;
  status: OrderStatus | string;
  previousStatus?: OrderStatus | string | null;
  actorId?: string;
  actorRole: "CUSTOMER" | "AGENT" | "ADMIN" | "SYSTEM" | string;
  actorName: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  failedReason?: string;
  rescheduledDate?: Date;
  rescheduledSlot?: string;
  proofOfDelivery?: string;
  isAdminOverride?: boolean;
}

/**
 * Valid allowed state transitions map.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PLACED", "CANCELLED"],
  PLACED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED", "ASSIGNED"], // re-assignment allowed
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "CANCELLED"],
  DELIVERED: [], // Terminal
  FAILED: ["RESCHEDULED", "CANCELLED"],
  RESCHEDULED: ["ASSIGNED", "OUT_FOR_DELIVERY", "CANCELLED"],
  CANCELLED: [], // Terminal
};

/**
 * Validates whether a requested transition is allowable according to standard delivery state machine rules.
 */
export function isValidTransition(
  currentStatus: OrderStatus | string,
  targetStatus: OrderStatus | string,
  isAdminOverride: boolean = false
): boolean {
  if (isAdminOverride) return true; // Admins have master override permissions
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus as OrderStatus] || [];
  return allowed.includes(targetStatus as OrderStatus);
}

/**
 * Executes a status change:
 * 1. Validates transition rules.
 * 2. Writes an immutable audit entry to OrderStatusHistory.
 * 3. Updates Order and Delivery Agent load records.
 * 4. Dispatches customer notification (Email & SMS).
 * 5. Handles automated reassignment on rescheduling.
 */
export async function logOrderStatusChange(
  params: LogStatusChangeParams
): Promise<{ success: boolean; message: string }> {
  const {
    orderId,
    status,
    actorId,
    actorRole,
    actorName,
    notes,
    latitude,
    longitude,
    failedReason,
    rescheduledDate,
    rescheduledSlot,
    proofOfDelivery,
    isAdminOverride = false,
  } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      assignedAgent: { include: { user: true } },
    },
  });

  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const previousStatus = params.previousStatus || (order.status as OrderStatus);

  if (!isValidTransition(previousStatus, status, isAdminOverride)) {
    throw new Error(
      `Invalid order state transition from ${previousStatus} to ${status}.`
    );
  }

  const effectiveNotes = isAdminOverride
    ? `[ADMIN OVERRIDE] ${notes || `Status manually overridden to ${status}`}`
    : notes;

  // Prepare database updates
  await prisma.$transaction(async (tx) => {
    // 1. Create immutable audit record
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status,
        previousStatus,
        actorId,
        actorRole,
        actorName,
        notes: effectiveNotes,
        latitude,
        longitude,
        timestamp: new Date(),
      },
    });

    // 2. Prepare Order update payload
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "PICKED_UP" && !order.pickedUpAt) {
      updateData.pickedUpAt = new Date();
    }

    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      if (proofOfDelivery) updateData.proofOfDelivery = proofOfDelivery;

      // Free up agent capacity
      if (order.assignedAgentId) {
        await tx.deliveryAgent.update({
          where: { id: order.assignedAgentId },
          data: { currentActiveLoad: { decrement: 1 } },
        });
      }
    }

    if (status === "FAILED") {
      updateData.failedReason = failedReason || notes || "Customer unavailable / Address issue";
      updateData.failedAt = new Date();

      // Free up agent capacity since delivery attempt has closed
      if (order.assignedAgentId) {
        await tx.deliveryAgent.update({
          where: { id: order.assignedAgentId },
          data: { currentActiveLoad: { decrement: 1 } },
        });
      }
    }

    if (status === "RESCHEDULED") {
      if (rescheduledDate) updateData.rescheduledDate = rescheduledDate;
      if (rescheduledSlot) updateData.rescheduledSlot = rescheduledSlot;
      if (notes) updateData.deliveryNotes = notes;
      // Reset failure metadata
      updateData.failedReason = null;
      updateData.failedAt = null;
    }

    await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });
  });

  // 3. Dispatch Email and SMS notifications to Customer
  const rescheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track/${order.trackingNumber}`;
  
  await sendOrderNotification({
    orderId,
    trackingNumber: order.trackingNumber,
    recipientEmail: order.customer.email,
    recipientPhone: order.recipientPhone || order.customer.phone,
    customerName: order.recipientName || order.customer.name,
    status,
    notes: failedReason || effectiveNotes,
    rescheduleUrl,
    orderSummary: {
      senderAddress: `${order.pickupAddress}, ${order.pickupCity}`,
      dropAddress: `${order.dropAddress}, ${order.dropCity}`,
      totalAmount: order.totalAmount,
      paymentType: order.paymentType,
    },
  });

  // 4. If status is RESCHEDULED, re-trigger intelligent auto-assignment
  if (status === "RESCHEDULED") {
    try {
      await autoAssignOrder(orderId, {
        id: actorId || "SYSTEM",
        name: "Auto-Reassignment Engine",
        role: "SYSTEM",
      });
    } catch (e) {
      console.warn("Auto-reassignment postponed:", e);
    }
  }

  return {
    success: true,
    message: `Order status updated to ${status} with immutable history logged.`,
  };
}
