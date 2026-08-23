import { describe, it, expect } from "vitest";
import {
  calculateVolumetricWeight,
  computeChargesWithRateCard,
} from "../src/lib/services/rateEngine";
import { calculateHaversineDistanceKm } from "../src/lib/services/zoneEngine";
import { isValidTransition, OrderStatus } from "../src/lib/services/trackingService";

describe("Rate Engine - Volumetric & Billable Weight Logic", () => {
  it("correctly computes volumetric weight via (L * W * H) / 5000", () => {
    // 50 x 40 x 30 cm = 60,000 / 5000 = 12.00 kg
    const volWeight = calculateVolumetricWeight(50, 40, 30);
    expect(volWeight).toBe(12.0);
  });

  it("handles decimal dimensions and roundups properly", () => {
    // 25 x 20 x 10 cm = 5000 / 5000 = 1.00 kg
    const volWeight = calculateVolumetricWeight(25, 20, 10);
    expect(volWeight).toBe(1.0);
  });

  it("bills on higher of actual vs volumetric weight (Volumetric > Actual)", () => {
    const mockRateCard = {
      id: "rc_1",
      name: "B2C Intra-Zone",
      baseWeightKg: 0.5,
      baseRate: 40.0,
      perKgRate: 15.0,
      codSurchargeFixed: 20.0,
      codSurchargePercent: 1.5,
      minCodSurcharge: 20.0,
    };

    const actualWeight = 0.5; // Light package
    const volumetricWeight = 2.0; // Bulky package

    const charges = computeChargesWithRateCard(
      actualWeight,
      volumetricWeight,
      mockRateCard,
      "PREPAID",
      0
    );

    expect(charges.billableWeightKg).toBe(2.0);
    expect(charges.weightBasis).toBe("VOLUMETRIC");
    expect(charges.baseCharge).toBe(40.0);
    // Additional weight = 2.0 - 0.5 = 1.5 kg -> 1.5 * $15 = $22.50
    expect(charges.additionalWeightKg).toBe(1.5);
    expect(charges.weightCharge).toBe(22.5);
    expect(charges.codCharge).toBe(0.0);
    expect(charges.totalAmount).toBe(62.5);
  });

  it("bills on higher of actual vs volumetric weight (Actual > Volumetric)", () => {
    const mockRateCard = {
      id: "rc_2",
      name: "B2C Intra-Zone",
      baseWeightKg: 0.5,
      baseRate: 40.0,
      perKgRate: 15.0,
      codSurchargeFixed: 20.0,
      codSurchargePercent: 1.5,
      minCodSurcharge: 20.0,
    };

    const actualWeight = 3.5; // Heavy dense package
    const volumetricWeight = 1.0;

    const charges = computeChargesWithRateCard(
      actualWeight,
      volumetricWeight,
      mockRateCard,
      "PREPAID",
      0
    );

    expect(charges.billableWeightKg).toBe(3.5);
    expect(charges.weightBasis).toBe("ACTUAL");
    // Additional weight = 3.5 - 0.5 = 3.0 kg -> 3.0 * $15 = $45.00
    expect(charges.additionalWeightKg).toBe(3.0);
    expect(charges.weightCharge).toBe(45.0);
    expect(charges.totalAmount).toBe(85.0);
  });

  it("correctly applies COD surcharge per configuration", () => {
    const mockRateCard = {
      id: "rc_3",
      name: "B2C Inter-Zone",
      baseWeightKg: 0.5,
      baseRate: 70.0,
      perKgRate: 25.0,
      codSurchargeFixed: 25.0,
      codSurchargePercent: 2.0,
      minCodSurcharge: 25.0,
    };

    // Case A: High declared value ($5,000 -> 2% is $100 > $25 fixed)
    const chargesHighVal = computeChargesWithRateCard(
      0.5,
      0.5,
      mockRateCard,
      "COD",
      5000
    );
    expect(chargesHighVal.codCharge).toBe(100.0);
    expect(chargesHighVal.totalAmount).toBe(170.0);

    // Case B: Low declared value ($500 -> 2% is $10 < $25 min fixed)
    const chargesLowVal = computeChargesWithRateCard(
      0.5,
      0.5,
      mockRateCard,
      "COD",
      500
    );
    expect(chargesLowVal.codCharge).toBe(25.0);
    expect(chargesLowVal.totalAmount).toBe(95.0);
  });
});

describe("Zone Engine - Distance & Proximity Calculations", () => {
  it("calculates accurate Haversine distance between coordinates", () => {
    // Connaught Place (28.6315, 77.2167) to Model Town (28.7118, 77.1923) ~ 9.2 km
    const dist = calculateHaversineDistanceKm(28.6315, 77.2167, 28.7118, 77.1923);
    expect(dist).toBeGreaterThan(8.5);
    expect(dist).toBeLessThan(10.5);
  });

  it("returns 0 km for identical coordinates", () => {
    const dist = calculateHaversineDistanceKm(28.6315, 77.2167, 28.6315, 77.2167);
    expect(dist).toBe(0);
  });
});

describe("Order State Machine - Lifecycle & Transition Validation", () => {
  it("allows valid forward lifecycle steps", () => {
    expect(isValidTransition("PLACED", "ASSIGNED")).toBe(true);
    expect(isValidTransition("ASSIGNED", "PICKED_UP")).toBe(true);
    expect(isValidTransition("PICKED_UP", "IN_TRANSIT")).toBe(true);
    expect(isValidTransition("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "FAILED")).toBe(true);
    expect(isValidTransition("FAILED", "RESCHEDULED")).toBe(true);
  });

  it("rejects illegal backward or jumping transitions", () => {
    // Cannot jump from PLACED directly to DELIVERED without assignment and pickup
    expect(isValidTransition("PLACED", "DELIVERED")).toBe(false);
    // Cannot move from DELIVERED back to PICKED_UP
    expect(isValidTransition("DELIVERED", "PICKED_UP")).toBe(false);
    // Cannot reschedule an order that is currently IN_TRANSIT
    expect(isValidTransition("IN_TRANSIT", "RESCHEDULED")).toBe(false);
  });

  it("permits Admin override when explicitly flagged", () => {
    expect(isValidTransition("PLACED", "DELIVERED", true)).toBe(true);
  });
});
