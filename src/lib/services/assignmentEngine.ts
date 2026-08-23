import { prisma } from "../prisma";
import { calculateHaversineDistanceKm } from "./zoneEngine";
import { logOrderStatusChange } from "./trackingService";

export interface AgentAssignmentCandidate {
  agentId: string;
  agentName: string;
  agentPhone: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  currentLatitude: number;
  currentLongitude: number;
  distanceToPickupKm: number;
  isOperatingInZone: boolean;
  currentActiveLoad: number;
  maxCapacity: number;
  computedScore: number;
}

export interface AssignmentResult {
  success: boolean;
  orderId: string;
  assignedAgent?: AgentAssignmentCandidate;
  evaluatedCandidatesCount: number;
  message: string;
}

/**
 * Finds and ranks the best delivery agent for a given order using multi-criteria optimization:
 * 1. Availability filter (isAvailable == true && currentActiveLoad < maxCapacity)
 * 2. Proximity (Haversine distance from agent's current location to order's pickup location)
 * 3. Operating Zone alignment (bonus for agents assigned to the pickup zone)
 * 4. Active load balancing (tie-breaker for agents with lower current delivery loads)
 */
export async function findBestAgentForOrder(
  orderId: string
): Promise<{ bestAgent: AgentAssignmentCandidate | null; rankedCandidates: AgentAssignmentCandidate[] }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { pickupZone: true },
  });

  if (!order) {
    throw new Error(`Order with ID ${orderId} not found.`);
  }

  // Fetch all available agents who have capacity
  const availableAgents = await prisma.deliveryAgent.findMany({
    where: {
      isAvailable: true,
    },
    include: {
      user: true,
      operatingZone: true,
    },
  });

  // Filter agents with active capacity remaining
  const eligibleAgents = availableAgents.filter(
    (agent) => agent.currentActiveLoad < agent.maxCapacity
  );

  if (eligibleAgents.length === 0) {
    return { bestAgent: null, rankedCandidates: [] };
  }

  // Score each candidate
  const candidates: AgentAssignmentCandidate[] = eligibleAgents.map((agent) => {
    const distanceKm = calculateHaversineDistanceKm(
      agent.currentLatitude,
      agent.currentLongitude,
      order.pickupLat,
      order.pickupLng
    );

    const isOperatingInZone =
      Boolean(agent.operatingZoneId && agent.operatingZoneId === order.pickupZoneId);

    // Multi-factor scoring heuristic: Lower score is better
    // Base is distance (km)
    // Add penalty for current load (+0.5 km per active order to balance load)
    // Give bonus if agent's designated operating zone matches pickup zone (-2.0 km equivalent)
    const loadPenalty = agent.currentActiveLoad * 0.5;
    const zoneBonus = isOperatingInZone ? -2.0 : 0.0;
    const computedScore = Math.max(0, distanceKm + loadPenalty + zoneBonus);

    return {
      agentId: agent.id,
      agentName: agent.user.name,
      agentPhone: agent.user.phone,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber,
      rating: agent.rating,
      currentLatitude: agent.currentLatitude,
      currentLongitude: agent.currentLongitude,
      distanceToPickupKm: distanceKm,
      isOperatingInZone,
      currentActiveLoad: agent.currentActiveLoad,
      maxCapacity: agent.maxCapacity,
      computedScore: Math.round(computedScore * 100) / 100,
    };
  });

  // Sort by computedScore ascending (best match first)
  candidates.sort((a, b) => a.computedScore - b.computedScore);

  return {
    bestAgent: candidates[0] || null,
    rankedCandidates: candidates,
  };
}

/**
 * Triggers automated assignment for an order to the nearest optimal delivery agent.
 */
export async function autoAssignOrder(
  orderId: string,
  actor?: { id?: string; name?: string; role?: string }
): Promise<AssignmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return {
      success: false,
      orderId,
      evaluatedCandidatesCount: 0,
      message: "Order not found.",
    };
  }

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    return {
      success: false,
      orderId,
      evaluatedCandidatesCount: 0,
      message: `Cannot assign agent to order with status ${order.status}.`,
    };
  }

  const { bestAgent, rankedCandidates } = await findBestAgentForOrder(orderId);

  if (!bestAgent) {
    return {
      success: false,
      orderId,
      evaluatedCandidatesCount: 0,
      message: "No available delivery agents with open capacity found in the system.",
    };
  }

  // Perform assignment in database
  await prisma.$transaction(async (tx) => {
    // If order already had an assigned agent, decrement previous agent's load
    if (order.assignedAgentId && order.assignedAgentId !== bestAgent.agentId) {
      await tx.deliveryAgent.update({
        where: { id: order.assignedAgentId },
        data: { currentActiveLoad: { decrement: 1 } },
      });
    }

    // Increment new agent's active load
    await tx.deliveryAgent.update({
      where: { id: bestAgent.agentId },
      data: { currentActiveLoad: { increment: 1 } },
    });

    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: bestAgent.agentId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });
  });

  // Log status history transition
  await logOrderStatusChange({
    orderId,
    status: "ASSIGNED",
    previousStatus: order.status,
    actorId: actor?.id || "SYSTEM_AUTO_ASSIGNER",
    actorRole: actor?.role || "SYSTEM",
    actorName: actor?.name || "Intelligent Auto-Assigner",
    notes: `Assigned to ${bestAgent.agentName} (${bestAgent.vehicleType} - ${bestAgent.vehicleNumber}). Proximity: ${bestAgent.distanceToPickupKm} km away.`,
  });

  return {
    success: true,
    orderId,
    assignedAgent: bestAgent,
    evaluatedCandidatesCount: rankedCandidates.length,
    message: `Successfully assigned to ${bestAgent.agentName} (${bestAgent.distanceToPickupKm} km away).`,
  };
}

/**
 * Manually assigns a specific agent to an order.
 */
export async function manualAssignAgent(
  orderId: string,
  agentId: string,
  actor: { id: string; name: string; role: string }
): Promise<AssignmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return {
      success: false,
      orderId,
      evaluatedCandidatesCount: 0,
      message: "Order not found.",
    };
  }

  const agent = await prisma.deliveryAgent.findUnique({
    where: { id: agentId },
    include: { user: true },
  });

  if (!agent) {
    return {
      success: false,
      orderId,
      evaluatedCandidatesCount: 0,
      message: "Delivery Agent not found.",
    };
  }

  await prisma.$transaction(async (tx) => {
    if (order.assignedAgentId && order.assignedAgentId !== agentId) {
      await tx.deliveryAgent.update({
        where: { id: order.assignedAgentId },
        data: { currentActiveLoad: { decrement: 1 } },
      });
    }

    await tx.deliveryAgent.update({
      where: { id: agentId },
      data: { currentActiveLoad: { increment: 1 } },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: agentId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });
  });

  await logOrderStatusChange({
    orderId,
    status: "ASSIGNED",
    previousStatus: order.status,
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    notes: `Manual assignment by Admin to ${agent.user.name} (${agent.vehicleType} - ${agent.vehicleNumber}).`,
  });

  return {
    success: true,
    orderId,
    assignedAgent: {
      agentId: agent.id,
      agentName: agent.user.name,
      agentPhone: agent.user.phone,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber,
      rating: agent.rating,
      currentLatitude: agent.currentLatitude,
      currentLongitude: agent.currentLongitude,
      distanceToPickupKm: calculateHaversineDistanceKm(
        agent.currentLatitude,
        agent.currentLongitude,
        order.pickupLat,
        order.pickupLng
      ),
      isOperatingInZone: Boolean(agent.operatingZoneId === order.pickupZoneId),
      currentActiveLoad: agent.currentActiveLoad + 1,
      maxCapacity: agent.maxCapacity,
      computedScore: 0,
    },
    evaluatedCandidatesCount: 1,
    message: `Manually assigned to ${agent.user.name}.`,
  };
}
