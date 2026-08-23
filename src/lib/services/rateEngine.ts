import { prisma } from "../prisma";
import { detectZonesForOrder, GeoLocation } from "./zoneEngine";

export interface RateCalculationInput {
  pickupPincode: string;
  dropPincode: string;
  pickupCoords?: GeoLocation;
  dropCoords?: GeoLocation;
  
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
  declaredValue?: number;
}

export interface RateCalculationBreakdown {
  // Dimension & Weight metrics
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  weightBasis: "ACTUAL" | "VOLUMETRIC";
  weightBasisExplanation: string;
  
  // Zone details
  pickupZoneId: string;
  pickupZoneName: string;
  pickupCoordinates?: GeoLocation;
  dropZoneId: string;
  dropZoneName: string;
  dropCoordinates?: GeoLocation;
  zoneScope: "INTRA_ZONE" | "INTER_ZONE";
  isSameZone: boolean;
  estimatedDistanceKm: number;
  
  // Rate Card applied
  rateCardId: string;
  rateCardName: string;
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
  baseWeightKg: number;
  baseRate: number;
  perKgRate: number;
  
  // Itemized financial charges
  baseCharge: number;
  additionalWeightKg: number;
  weightCharge: number;
  codCharge: number;
  taxAmount: number;
  totalAmount: number;
  
  // User-friendly formula explanation
  formulaExplanation: {
    volumetricFormula: string;
    weightDecision: string;
    rateFormula: string;
    codFormula: string;
    totalFormula: string;
  };
}

/**
 * Calculates volumetric weight in kg based on standard courier formula:
 * (Length × Breadth × Height) / 5000
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    return 0;
  }
  const volumetric = (lengthCm * widthCm * heightCm) / 5000;
  return Math.round(volumetric * 100) / 100;
}

/**
 * Pure calculation logic for billing rates given parameters and a rate card.
 */
export function computeChargesWithRateCard(
  actualWeightKg: number,
  volumetricWeightKg: number,
  rateCard: {
    id: string;
    name: string;
    baseWeightKg: number;
    baseRate: number;
    perKgRate: number;
    codSurchargeFixed: number;
    codSurchargePercent: number;
    minCodSurcharge: number;
  },
  paymentType: "PREPAID" | "COD",
  declaredValue: number = 0
): {
  billableWeightKg: number;
  weightBasis: "ACTUAL" | "VOLUMETRIC";
  baseCharge: number;
  additionalWeightKg: number;
  weightCharge: number;
  codCharge: number;
  taxAmount: number;
  totalAmount: number;
} {
  const roundedActual = Math.round(actualWeightKg * 100) / 100;
  const roundedVolumetric = Math.round(volumetricWeightKg * 100) / 100;
  
  const billableWeightKg = Math.max(roundedActual, roundedVolumetric);
  const weightBasis = roundedVolumetric > roundedActual ? "VOLUMETRIC" : "ACTUAL";
  
  const baseCharge = rateCard.baseRate;
  const additionalWeightKg = Math.max(0, Math.round((billableWeightKg - rateCard.baseWeightKg) * 100) / 100);
  const weightCharge = Math.round(additionalWeightKg * rateCard.perKgRate * 100) / 100;
  
  let codCharge = 0;
  if (paymentType === "COD") {
    const percentSurcharge = (declaredValue * rateCard.codSurchargePercent) / 100;
    codCharge = Math.max(rateCard.codSurchargeFixed, rateCard.minCodSurcharge, percentSurcharge);
    codCharge = Math.round(codCharge * 100) / 100;
  }
  
  const subtotal = Math.round((baseCharge + weightCharge + codCharge) * 100) / 100;
  const taxAmount = 0; // Flat or exempt; easily configurable
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    billableWeightKg,
    weightBasis,
    baseCharge,
    additionalWeightKg,
    weightCharge,
    codCharge,
    taxAmount,
    totalAmount,
  };
}

/**
 * Full rate calculation pipeline:
 * 1. Detects pickup and drop zones & scope (INTRA_ZONE vs INTER_ZONE).
 * 2. Calculates volumetric weight (L*B*H / 5000) & billable weight = max(actual, volumetric).
 * 3. Dynamically queries the configured RateCard from the database (No hardcoding).
 * 4. Calculates base charges, incremental weight charges, and COD surcharges.
 * 5. Returns a comprehensive itemized breakdown.
 */
export async function calculateDeliveryRate(
  input: RateCalculationInput
): Promise<RateCalculationBreakdown> {
  const {
    pickupPincode,
    dropPincode,
    pickupCoords,
    dropCoords,
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    orderType,
    paymentType,
    declaredValue = 0,
  } = input;

  // 1. Zone detection
  const zoneResult = await detectZonesForOrder(
    pickupPincode,
    dropPincode,
    pickupCoords,
    dropCoords
  );

  // 2. Volumetric calculation
  const volumetricWeightKg = calculateVolumetricWeight(lengthCm, widthCm, heightCm);

  // 3. Dynamic RateCard Lookup from DB based on orderType and zoneScope
  let rateCard = await prisma.rateCard.findFirst({
    where: {
      orderType,
      zoneScope: zoneResult.zoneScope,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fallback to any active rate card for orderType if specific zone scope card not found
  if (!rateCard) {
    rateCard = await prisma.rateCard.findFirst({
      where: { orderType, isActive: true },
    });
  }

  // If still no rate card in database, throw a descriptive error
  if (!rateCard) {
    throw new Error(
      `No active rate card configured for Order Type "${orderType}" and Zone Scope "${zoneResult.zoneScope}". Please configure rate cards in Admin dashboard.`
    );
  }

  // 4. Compute financial charges
  const charges = computeChargesWithRateCard(
    actualWeightKg,
    volumetricWeightKg,
    rateCard,
    paymentType,
    declaredValue
  );

  const weightBasisExplanation =
    charges.weightBasis === "VOLUMETRIC"
      ? `Volumetric weight (${volumetricWeightKg} kg) is higher than actual weight (${actualWeightKg} kg). Billing is based on ${volumetricWeightKg} kg.`
      : `Actual weight (${actualWeightKg} kg) is higher than volumetric weight (${volumetricWeightKg} kg). Billing is based on ${actualWeightKg} kg.`;

  return {
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    volumetricWeightKg,
    billableWeightKg: charges.billableWeightKg,
    weightBasis: charges.weightBasis,
    weightBasisExplanation,

    pickupZoneId: zoneResult.pickupZoneId,
    pickupZoneName: zoneResult.pickupZoneName,
    pickupCoordinates: zoneResult.pickupCoordinates,
    dropZoneId: zoneResult.dropZoneId,
    dropZoneName: zoneResult.dropZoneName,
    dropCoordinates: zoneResult.dropCoordinates,
    zoneScope: zoneResult.zoneScope,
    isSameZone: zoneResult.isSameZone,
    estimatedDistanceKm: zoneResult.estimatedDistanceKm,

    rateCardId: rateCard.id,
    rateCardName: rateCard.name,
    orderType,
    paymentType,
    baseWeightKg: rateCard.baseWeightKg,
    baseRate: rateCard.baseRate,
    perKgRate: rateCard.perKgRate,

    baseCharge: charges.baseCharge,
    additionalWeightKg: charges.additionalWeightKg,
    weightCharge: charges.weightCharge,
    codCharge: charges.codCharge,
    taxAmount: charges.taxAmount,
    totalAmount: charges.totalAmount,

    formulaExplanation: {
      volumetricFormula: `(${lengthCm} × ${widthCm} × ${heightCm}) ÷ 5000 = ${volumetricWeightKg} kg`,
      weightDecision: `max(${actualWeightKg} kg actual, ${volumetricWeightKg} kg volumetric) = ${charges.billableWeightKg} kg`,
      rateFormula: `Base (up to ${rateCard.baseWeightKg} kg) = $${rateCard.baseRate} + (${charges.additionalWeightKg} kg extra × $${rateCard.perKgRate}/kg) = $${charges.baseCharge + charges.weightCharge}`,
      codFormula: paymentType === "COD" ? `COD Surcharge applied = $${charges.codCharge}` : "Prepaid order (No COD surcharge)",
      totalFormula: `$${charges.baseCharge} (Base) + $${charges.weightCharge} (Weight) + $${charges.codCharge} (COD) = $${charges.totalAmount}`,
    },
  };
}
