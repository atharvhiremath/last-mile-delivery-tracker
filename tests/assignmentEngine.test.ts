import { describe, it, expect } from "vitest";
import { calculateHaversineDistanceKm } from "../src/lib/services/zoneEngine";

describe("Agent Auto-Assignment Optimization Heuristic", () => {
  interface MockAgent {
    id: string;
    name: string;
    lat: number;
    lng: number;
    operatingZoneId: string;
    isAvailable: boolean;
    maxCapacity: number;
    currentActiveLoad: number;
  }

  function rankMockAgents(
    pickupLat: number,
    pickupLng: number,
    pickupZoneId: string,
    agents: MockAgent[]
  ) {
    const eligible = agents.filter((a) => a.isAvailable && a.currentActiveLoad < a.maxCapacity);

    return eligible
      .map((agent) => {
        const distanceKm = calculateHaversineDistanceKm(agent.lat, agent.lng, pickupLat, pickupLng);
        const isZoneMatch = agent.operatingZoneId === pickupZoneId;
        const score = distanceKm + agent.currentActiveLoad * 0.5 - (isZoneMatch ? 2.0 : 0.0);
        return {
          ...agent,
          distanceKm,
          score,
        };
      })
      .sort((a, b) => a.score - b.score);
  }

  const pickupLat = 28.7041;
  const pickupLng = 77.1025;
  const pickupZoneId = "ZONE_NORTH";

  it("selects the nearest available agent when loads are equal", () => {
    const agents: MockAgent[] = [
      {
        id: "agent_far",
        name: "Far Agent",
        lat: 28.5355, // ~19 km away
        lng: 77.2500,
        operatingZoneId: "ZONE_SOUTH",
        isAvailable: true,
        maxCapacity: 5,
        currentActiveLoad: 0,
      },
      {
        id: "agent_near",
        name: "Near Agent",
        lat: 28.7040, // ~0.1 km away
        lng: 77.1020,
        operatingZoneId: "ZONE_NORTH",
        isAvailable: true,
        maxCapacity: 5,
        currentActiveLoad: 0,
      },
    ];

    const ranked = rankMockAgents(pickupLat, pickupLng, pickupZoneId, agents);
    expect(ranked[0].id).toBe("agent_near");
  });

  it("filters out offline / unavailable agents", () => {
    const agents: MockAgent[] = [
      {
        id: "agent_offline",
        name: "Offline Agent",
        lat: 28.7040,
        lng: 77.1020,
        operatingZoneId: "ZONE_NORTH",
        isAvailable: false, // Offline
        maxCapacity: 5,
        currentActiveLoad: 0,
      },
      {
        id: "agent_online",
        name: "Online Agent",
        lat: 28.6500,
        lng: 77.1200,
        operatingZoneId: "ZONE_WEST",
        isAvailable: true,
        maxCapacity: 5,
        currentActiveLoad: 0,
      },
    ];

    const ranked = rankMockAgents(pickupLat, pickupLng, pickupZoneId, agents);
    expect(ranked.length).toBe(1);
    expect(ranked[0].id).toBe("agent_online");
  });

  it("filters out agents who are at max capacity", () => {
    const agents: MockAgent[] = [
      {
        id: "agent_busy",
        name: "Busy Agent",
        lat: 28.7040,
        lng: 77.1020,
        operatingZoneId: "ZONE_NORTH",
        isAvailable: true,
        maxCapacity: 3,
        currentActiveLoad: 3, // Full capacity!
      },
      {
        id: "agent_free",
        name: "Free Agent",
        lat: 28.6500,
        lng: 77.1200,
        operatingZoneId: "ZONE_NORTH",
        isAvailable: true,
        maxCapacity: 5,
        currentActiveLoad: 1, // Open capacity
      },
    ];

    const ranked = rankMockAgents(pickupLat, pickupLng, pickupZoneId, agents);
    expect(ranked.length).toBe(1);
    expect(ranked[0].id).toBe("agent_free");
  });
});
