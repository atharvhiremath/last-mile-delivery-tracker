import { prisma } from "../prisma";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface ZoneDetectionResult {
  pickupZoneId: string;
  pickupZoneName: string;
  pickupZoneCode: string;
  pickupAreaName: string;
  pickupCity: string;
  pickupCoordinates: GeoLocation;
  
  dropZoneId: string;
  dropZoneName: string;
  dropZoneCode: string;
  dropAreaName: string;
  dropCity: string;
  dropCoordinates: GeoLocation;
  
  isSameZone: boolean;
  zoneScope: "INTRA_ZONE" | "INTER_ZONE";
  estimatedDistanceKm: number;
}

/**
 * Calculates straight-line great-circle distance between two points on Earth using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Resolves an address / pincode to a Zone and coordinate record.
 * Falls back to finding the nearest active zone centroid if exact pincode is not indexed.
 */
export async function resolveLocationToZone(
  pincode: string,
  customLat?: number,
  customLng?: number
): Promise<{
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  areaName: string;
  city: string;
  coordinates: GeoLocation;
}> {
  // 1. Try exact pincode match in database
  const areaRecord = await prisma.areaPincode.findFirst({
    where: { pincode: pincode.trim() },
    include: { zone: true },
  });

  if (areaRecord && areaRecord.zone && areaRecord.zone.isActive) {
    return {
      zoneId: areaRecord.zoneId,
      zoneName: areaRecord.zone.name,
      zoneCode: areaRecord.zone.code,
      areaName: areaRecord.areaName,
      city: areaRecord.city,
      coordinates: {
        latitude: customLat ?? areaRecord.latitude,
        longitude: customLng ?? areaRecord.longitude,
      },
    };
  }

  // 2. If coordinates are available, find nearest active zone centroid
  const activeZones = await prisma.zone.findMany({
    where: { isActive: true },
    include: { pincodes: true },
  });

  if (!activeZones.length) {
    throw new Error("No active delivery zones configured in the system. Please configure zones in Admin portal.");
  }

  if (customLat !== undefined && customLng !== undefined) {
    let nearestZone = activeZones[0];
    let minDistance = Infinity;

    for (const zone of activeZones) {
      const dist = calculateHaversineDistanceKm(
        customLat,
        customLng,
        zone.centerLat,
        zone.centerLng
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestZone = zone;
      }
    }

    return {
      zoneId: nearestZone.id,
      zoneName: nearestZone.name,
      zoneCode: nearestZone.code,
      areaName: nearestZone.pincodes[0]?.areaName || "Metro Area",
      city: nearestZone.pincodes[0]?.city || "Metropolis",
      coordinates: { latitude: customLat, longitude: customLng },
    };
  }

  // 3. Fallback to the first active default zone
  const defaultZone = activeZones[0];
  return {
    zoneId: defaultZone.id,
    zoneName: defaultZone.name,
    zoneCode: defaultZone.code,
    areaName: defaultZone.pincodes[0]?.areaName || "General Area",
    city: defaultZone.pincodes[0]?.city || "Metropolis",
    coordinates: {
      latitude: defaultZone.centerLat,
      longitude: defaultZone.centerLng,
    },
  };
}

/**
 * Detects zones for pickup and drop locations and determines intra/inter zone scope.
 */
export async function detectZonesForOrder(
  pickupPincode: string,
  dropPincode: string,
  pickupCoords?: GeoLocation,
  dropCoords?: GeoLocation
): Promise<ZoneDetectionResult> {
  const pickup = await resolveLocationToZone(
    pickupPincode,
    pickupCoords?.latitude,
    pickupCoords?.longitude
  );

  const drop = await resolveLocationToZone(
    dropPincode,
    dropCoords?.latitude,
    dropCoords?.longitude
  );

  const isSameZone = pickup.zoneId === drop.zoneId;
  const zoneScope: "INTRA_ZONE" | "INTER_ZONE" = isSameZone
    ? "INTRA_ZONE"
    : "INTER_ZONE";

  const estimatedDistanceKm = calculateHaversineDistanceKm(
    pickup.coordinates.latitude,
    pickup.coordinates.longitude,
    drop.coordinates.latitude,
    drop.coordinates.longitude
  );

  return {
    pickupZoneId: pickup.zoneId,
    pickupZoneName: pickup.zoneName,
    pickupZoneCode: pickup.zoneCode,
    pickupAreaName: pickup.areaName,
    pickupCity: pickup.city,
    pickupCoordinates: pickup.coordinates,

    dropZoneId: drop.zoneId,
    dropZoneName: drop.zoneName,
    dropZoneCode: drop.zoneCode,
    dropAreaName: drop.areaName,
    dropCity: drop.city,
    dropCoordinates: drop.coordinates,

    isSameZone,
    zoneScope,
    estimatedDistanceKm,
  };
}
