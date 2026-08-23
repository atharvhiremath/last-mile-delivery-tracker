import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Last-Mile Delivery Tracker database seed...");

  const userCount = await prisma.user.count().catch(() => 0);
  if (userCount > 0) {
    console.log(`Database already contains ${userCount} registered users. Preserving all records and skipping re-seed.`);
    return;
  }

  // Clear existing records for initial clean seed
  await prisma.notificationLog.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.areaPincode.deleteMany();
  await prisma.deliveryAgent.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing database records for initial seed.");

  // 1. Create Zones
  const zoneNorth = await prisma.zone.create({
    data: {
      name: "North Metro Hub",
      code: "ZONE-NORTH",
      description: "North urban sector covering university, model town, and industrial estates.",
      centerLat: 28.7041,
      centerLng: 77.1025,
      isActive: true,
    },
  });

  const zoneSouth = await prisma.zone.create({
    data: {
      name: "South Commercial Hub",
      code: "ZONE-SOUTH",
      description: "South business, commercial districts, tech parks, and residential hubs.",
      centerLat: 28.5355,
      centerLng: 77.2500,
      isActive: true,
    },
  });

  const zoneEast = await prisma.zone.create({
    data: {
      name: "East Riverfront Hub",
      code: "ZONE-EAST",
      description: "East residential corridors and trans-river logistics terminals.",
      centerLat: 28.6280,
      centerLng: 77.2950,
      isActive: true,
    },
  });

  const zoneWest = await prisma.zone.create({
    data: {
      name: "West Commercial Corridor",
      code: "ZONE-WEST",
      description: "West high-density markets and commercial zones.",
      centerLat: 28.6500,
      centerLng: 77.1200,
      isActive: true,
    },
  });

  const zoneCentral = await prisma.zone.create({
    data: {
      name: "Central Business District",
      code: "ZONE-CENTRAL",
      description: "Central financial and government institutional center.",
      centerLat: 28.6200,
      centerLng: 77.2150,
      isActive: true,
    },
  });

  console.log("Created 5 Delivery Zones.");

  // 2. Create Area Pincodes
  const pincodeData = [
    // North Zone
    { pincode: "110001", areaName: "Connaught Place / North Central", city: "New Delhi", state: "Delhi", zoneId: zoneNorth.id, latitude: 28.6315, longitude: 77.2167 },
    { pincode: "110007", areaName: "Delhi University / North", city: "New Delhi", state: "Delhi", zoneId: zoneNorth.id, latitude: 28.6934, longitude: 77.2104 },
    { pincode: "110009", areaName: "Model Town / North", city: "New Delhi", state: "Delhi", zoneId: zoneNorth.id, latitude: 28.7118, longitude: 77.1923 },
    { pincode: "110033", areaName: "Adarsh Nagar / North", city: "New Delhi", state: "Delhi", zoneId: zoneNorth.id, latitude: 28.7242, longitude: 77.1643 },

    // South Zone
    { pincode: "110017", areaName: "Saket & Malviya Nagar", city: "New Delhi", state: "Delhi", zoneId: zoneSouth.id, latitude: 28.5245, longitude: 77.2066 },
    { pincode: "110019", areaName: "Kalkaji / Nehru Place", city: "New Delhi", state: "Delhi", zoneId: zoneSouth.id, latitude: 28.5492, longitude: 77.2533 },
    { pincode: "110020", areaName: "Okhla Industrial Area", city: "New Delhi", state: "Delhi", zoneId: zoneSouth.id, latitude: 28.5298, longitude: 77.2711 },
    { pincode: "110024", areaName: "Lajpat Nagar / South", city: "New Delhi", state: "Delhi", zoneId: zoneSouth.id, latitude: 28.5700, longitude: 77.2400 },
    { pincode: "110048", areaName: "Greater Kailash", city: "New Delhi", state: "Delhi", zoneId: zoneSouth.id, latitude: 28.5380, longitude: 77.2370 },

    // East Zone
    { pincode: "110091", areaName: "Mayur Vihar Phase 1", city: "New Delhi", state: "Delhi", zoneId: zoneEast.id, latitude: 28.6080, longitude: 77.2960 },
    { pincode: "110092", areaName: "Laxmi Nagar / East", city: "New Delhi", state: "Delhi", zoneId: zoneEast.id, latitude: 28.6310, longitude: 77.2770 },
    { pincode: "110095", areaName: "Dilshad Garden", city: "New Delhi", state: "Delhi", zoneId: zoneEast.id, latitude: 28.6810, longitude: 77.3180 },

    // West Zone
    { pincode: "110015", areaName: "Kirti Nagar / Industrial", city: "New Delhi", state: "Delhi", zoneId: zoneWest.id, latitude: 28.6550, longitude: 77.1390 },
    { pincode: "110027", areaName: "Rajouri Garden", city: "New Delhi", state: "Delhi", zoneId: zoneWest.id, latitude: 28.6480, longitude: 77.1210 },
    { pincode: "110058", areaName: "Janakpuri / West", city: "New Delhi", state: "Delhi", zoneId: zoneWest.id, latitude: 28.6210, longitude: 77.0870 },

    // Central Zone
    { pincode: "110002", areaName: "Daryaganj / Old Delhi", city: "New Delhi", state: "Delhi", zoneId: zoneCentral.id, latitude: 28.6430, longitude: 77.2410 },
    { pincode: "110005", areaName: "Karol Bagh / Central", city: "New Delhi", state: "Delhi", zoneId: zoneCentral.id, latitude: 28.6520, longitude: 77.1910 },
  ];

  for (const p of pincodeData) {
    await prisma.areaPincode.create({ data: p });
  }
  console.log(`Created ${pincodeData.length} Area Pincode mappings.`);

  // 3. Create Rate Cards
  const rateCards = [
    {
      name: "Standard B2C Intra-Zone Delivery",
      orderType: "B2C",
      zoneScope: "INTRA_ZONE",
      baseWeightKg: 0.5,
      baseRate: 40.0,
      perKgRate: 15.0,
      codSurchargeFixed: 20.0,
      codSurchargePercent: 1.5,
      minCodSurcharge: 20.0,
      isActive: true,
    },
    {
      name: "Standard B2C Inter-Zone Delivery",
      orderType: "B2C",
      zoneScope: "INTER_ZONE",
      baseWeightKg: 0.5,
      baseRate: 70.0,
      perKgRate: 25.0,
      codSurchargeFixed: 25.0,
      codSurchargePercent: 2.0,
      minCodSurcharge: 25.0,
      isActive: true,
    },
    {
      name: "Bulk B2B Intra-Zone Freight",
      orderType: "B2B",
      zoneScope: "INTRA_ZONE",
      baseWeightKg: 10.0,
      baseRate: 150.0,
      perKgRate: 8.0,
      codSurchargeFixed: 50.0,
      codSurchargePercent: 1.0,
      minCodSurcharge: 50.0,
      isActive: true,
    },
    {
      name: "Bulk B2B Inter-Zone Freight",
      orderType: "B2B",
      zoneScope: "INTER_ZONE",
      baseWeightKg: 10.0,
      baseRate: 250.0,
      perKgRate: 12.0,
      codSurchargeFixed: 60.0,
      codSurchargePercent: 1.2,
      minCodSurcharge: 60.0,
      isActive: true,
    },
  ];

  for (const rc of rateCards) {
    await prisma.rateCard.create({ data: rc });
  }
  console.log("Created 4 Configured Rate Cards (B2B & B2C Intra/Inter).");

  // 4. Create Users (Admin, Customers, Delivery Agents)
  const passwordHash = bcrypt.hashSync("password123", 10);
  const adminHash = bcrypt.hashSync("admin123", 10);
  const agentHash = bcrypt.hashSync("agent123", 10);
  const customerHash = bcrypt.hashSync("customer123", 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@deliverytracker.com",
      passwordHash: adminHash,
      name: "System Admin",
      phone: "+91 98110 00001",
      role: "ADMIN",
    },
  });

  // B2C Customer User
  const customerB2C = await prisma.user.create({
    data: {
      email: "customer@gmail.com",
      passwordHash: customerHash,
      name: "Sarah Jenkins",
      phone: "+91 98220 11111",
      role: "CUSTOMER",
    },
  });

  // B2B Customer User
  const customerB2B = await prisma.user.create({
    data: {
      email: "b2b@acmecorp.com",
      passwordHash: customerHash,
      name: "Acme Industrial Supplies",
      companyName: "Acme Corp Ltd.",
      phone: "+91 98330 22222",
      role: "CUSTOMER",
    },
  });

  // Delivery Agents
  const agent1User = await prisma.user.create({
    data: {
      email: "agent.rajesh@deliverytracker.com",
      passwordHash: agentHash,
      name: "Rajesh Kumar",
      phone: "+91 98440 33331",
      role: "AGENT",
    },
  });

  const agent1 = await prisma.deliveryAgent.create({
    data: {
      userId: agent1User.id,
      vehicleType: "BIKE",
      vehicleNumber: "DL-01-BK-9921",
      operatingZoneId: zoneNorth.id,
      currentLatitude: 28.7040,
      currentLongitude: 77.1020,
      isAvailable: true,
      maxCapacity: 5,
      currentActiveLoad: 0,
      rating: 4.95,
    },
  });

  const agent2User = await prisma.user.create({
    data: {
      email: "agent.amit@deliverytracker.com",
      passwordHash: agentHash,
      name: "Amit Sharma",
      phone: "+91 98440 33332",
      role: "AGENT",
    },
  });

  const agent2 = await prisma.deliveryAgent.create({
    data: {
      userId: agent2User.id,
      vehicleType: "ELECTRIC_VAN",
      vehicleNumber: "DL-03-EV-4412",
      operatingZoneId: zoneSouth.id,
      currentLatitude: 28.5350,
      currentLongitude: 77.2510,
      isAvailable: true,
      maxCapacity: 6,
      currentActiveLoad: 1,
      rating: 4.88,
    },
  });

  const agent3User = await prisma.user.create({
    data: {
      email: "agent.priya@deliverytracker.com",
      passwordHash: agentHash,
      name: "Priya Singh",
      phone: "+91 98440 33333",
      role: "AGENT",
    },
  });

  const agent3 = await prisma.deliveryAgent.create({
    data: {
      userId: agent3User.id,
      vehicleType: "SCOOTER",
      vehicleNumber: "DL-02-SC-7823",
      operatingZoneId: zoneWest.id,
      currentLatitude: 28.6510,
      currentLongitude: 77.1210,
      isAvailable: true,
      maxCapacity: 4,
      currentActiveLoad: 0,
      rating: 4.92,
    },
  });

  const agent4User = await prisma.user.create({
    data: {
      email: "agent.vikram@deliverytracker.com",
      passwordHash: agentHash,
      name: "Vikram Malhotra",
      phone: "+91 98440 33334",
      role: "AGENT",
    },
  });

  const agent4 = await prisma.deliveryAgent.create({
    data: {
      userId: agent4User.id,
      vehicleType: "TRUCK",
      vehicleNumber: "DL-04-TR-5531",
      operatingZoneId: zoneCentral.id,
      currentLatitude: 28.6210,
      currentLongitude: 77.2160,
      isAvailable: true,
      maxCapacity: 8,
      currentActiveLoad: 0,
      rating: 4.82,
    },
  });

  console.log("Created Admin, Customers, and 4 Delivery Agents with GPS coordinates.");

  // 5. Create Realistic Sample Orders Across Statuses

  // ORDER 1: Delivered Order
  const order1 = await prisma.order.create({
    data: {
      trackingNumber: "LMD-2026-10001",
      customerId: customerB2C.id,
      senderName: "TechHub Electronics",
      senderPhone: "+91 98110 99001",
      pickupAddress: "Shop 14, Inner Circle, Connaught Place",
      pickupPincode: "110001",
      pickupArea: "Connaught Place",
      pickupCity: "New Delhi",
      pickupZoneId: zoneNorth.id,
      pickupLat: 28.6315,
      pickupLng: 77.2167,

      recipientName: "Dr. Arvind Mehta",
      recipientPhone: "+91 98110 99002",
      dropAddress: "Flat 402, Sunshine Apts, Model Town",
      dropPincode: "110009",
      dropArea: "Model Town",
      dropCity: "New Delhi",
      dropZoneId: zoneNorth.id,
      dropLat: 28.7118,
      dropLng: 77.1923,

      lengthCm: 25,
      widthCm: 20,
      heightCm: 10,
      actualWeightKg: 1.2,
      volumetricWeightKg: 1.0,
      billableWeightKg: 1.2,

      orderType: "B2C",
      paymentType: "PREPAID",
      itemDescription: "Wireless Noise-Cancelling Headphones",
      declaredValue: 4500,

      baseCharge: 40.0,
      weightCharge: 10.5,
      codCharge: 0.0,
      taxAmount: 0.0,
      totalAmount: 50.5,

      status: "DELIVERED",
      assignedAgentId: agent1.id,
      assignedAt: new Date(Date.now() - 4 * 3600 * 1000),
      pickedUpAt: new Date(Date.now() - 3 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 30 * 60 * 1000),
      proofOfDelivery: "Delivered to security desk / Signed by Arvind Mehta",
    },
  });

  const o1History = [
    { status: "PLACED", actorRole: "CUSTOMER", actorName: "Sarah Jenkins", notes: "Order booked and prepaid.", timestamp: new Date(Date.now() - 5 * 3600 * 1000) },
    { status: "ASSIGNED", actorRole: "SYSTEM", actorName: "Intelligent Auto-Assigner", notes: `Assigned to Rajesh Kumar (Bike - DL-01-BK-9921)`, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
    { status: "PICKED_UP", actorRole: "AGENT", actorName: "Rajesh Kumar", notes: "Package verified and picked up from sender.", timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
    { status: "IN_TRANSIT", actorRole: "AGENT", actorName: "Rajesh Kumar", notes: "Moving through North sector corridor.", timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
    { status: "OUT_FOR_DELIVERY", actorRole: "AGENT", actorName: "Rajesh Kumar", notes: "Agent arriving in 15 minutes.", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
    { status: "DELIVERED", actorRole: "AGENT", actorName: "Rajesh Kumar", notes: "Delivered to customer. Signature collected.", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
  ];

  for (const h of o1History) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order1.id,
        status: h.status,
        actorRole: h.actorRole,
        actorName: h.actorName,
        notes: h.notes,
        timestamp: h.timestamp,
      },
    });
  }

  // ORDER 2: Out for Delivery (Live Active COD Order)
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: "LMD-2026-10002",
      customerId: customerB2C.id,
      senderName: "Gourmet Coffee Roasters",
      senderPhone: "+91 98110 88001",
      pickupAddress: "Plot 88, Okhla Phase 3",
      pickupPincode: "110020",
      pickupArea: "Okhla Industrial Area",
      pickupCity: "New Delhi",
      pickupZoneId: zoneSouth.id,
      pickupLat: 28.5298,
      pickupLng: 77.2711,

      recipientName: "Meera Kapoor",
      recipientPhone: "+91 98110 88002",
      dropAddress: "B-12, Green Park Extension",
      dropPincode: "110017",
      dropArea: "Saket & Malviya Nagar",
      dropCity: "New Delhi",
      dropZoneId: zoneSouth.id,
      dropLat: 28.5245,
      dropLng: 77.2066,

      lengthCm: 20,
      widthCm: 15,
      heightCm: 12,
      actualWeightKg: 0.8,
      volumetricWeightKg: 0.72,
      billableWeightKg: 0.8,

      orderType: "B2C",
      paymentType: "COD",
      itemDescription: "Artisanal Coffee Beans (Pack of 3)",
      declaredValue: 1200,

      baseCharge: 40.0,
      weightCharge: 4.5,
      codCharge: 20.0, // Fixed COD surcharge
      taxAmount: 0.0,
      totalAmount: 64.5,

      status: "OUT_FOR_DELIVERY",
      assignedAgentId: agent2.id,
      assignedAt: new Date(Date.now() - 2 * 3600 * 1000),
      pickedUpAt: new Date(Date.now() - 90 * 60 * 1000),
      deliveryNotes: "Please call before arriving. Gate code #4490.",
    },
  });

  const o2History = [
    { status: "PLACED", actorRole: "CUSTOMER", actorName: "Sarah Jenkins", notes: "Order booked with COD payment.", timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
    { status: "ASSIGNED", actorRole: "SYSTEM", actorName: "Intelligent Auto-Assigner", notes: `Assigned to Amit Sharma (Electric Van - DL-03-EV-4412)`, timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
    { status: "PICKED_UP", actorRole: "AGENT", actorName: "Amit Sharma", notes: "Package scanned and in van.", timestamp: new Date(Date.now() - 90 * 60 * 1000) },
    { status: "IN_TRANSIT", actorRole: "AGENT", actorName: "Amit Sharma", notes: "En route to South sector delivery cluster.", timestamp: new Date(Date.now() - 45 * 60 * 1000) },
    { status: "OUT_FOR_DELIVERY", actorRole: "AGENT", actorName: "Amit Sharma", notes: "Out for delivery. Collect COD payment $64.50.", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  ];

  for (const h of o2History) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order2.id,
        status: h.status,
        actorRole: h.actorRole,
        actorName: h.actorName,
        notes: h.notes,
        timestamp: h.timestamp,
      },
    });
  }

  // ORDER 3: FAILED ORDER (Ready for Reschedule testing!)
  const order3 = await prisma.order.create({
    data: {
      trackingNumber: "LMD-2026-10003",
      customerId: customerB2C.id,
      senderName: "Boutique Apparel",
      senderPhone: "+91 98110 77001",
      pickupAddress: "45, Main Market, Rajouri Garden",
      pickupPincode: "110027",
      pickupArea: "Rajouri Garden",
      pickupCity: "New Delhi",
      pickupZoneId: zoneWest.id,
      pickupLat: 28.6480,
      pickupLng: 77.1210,

      recipientName: "Kunal Verma",
      recipientPhone: "+91 98110 77002",
      dropAddress: "Tower C, Apartment 904, Janakpuri",
      dropPincode: "110058",
      dropArea: "Janakpuri",
      dropCity: "New Delhi",
      dropZoneId: zoneWest.id,
      dropLat: 28.6210,
      dropLng: 77.0870,

      lengthCm: 30,
      widthCm: 25,
      heightCm: 8,
      actualWeightKg: 0.5,
      volumetricWeightKg: 1.2, // Volumetric billed!
      billableWeightKg: 1.2,

      orderType: "B2C",
      paymentType: "COD",
      itemDescription: "Designer Winter Jacket",
      declaredValue: 3200,

      baseCharge: 40.0,
      weightCharge: 10.5,
      codCharge: 20.0,
      taxAmount: 0.0,
      totalAmount: 70.5,

      status: "FAILED",
      failedReason: "Customer Unavailable - Door locked, phone unanswered after 3 attempts",
      failedAt: new Date(Date.now() - 40 * 60 * 1000),
    },
  });

  const o3History = [
    { status: "PLACED", actorRole: "CUSTOMER", actorName: "Sarah Jenkins", notes: "Order booked.", timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
    { status: "ASSIGNED", actorRole: "SYSTEM", actorName: "Auto-Assigner", notes: "Assigned to Priya Singh", timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
    { status: "PICKED_UP", actorRole: "AGENT", actorName: "Priya Singh", notes: "Picked up.", timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
    { status: "OUT_FOR_DELIVERY", actorRole: "AGENT", actorName: "Priya Singh", notes: "Out for delivery.", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
    { status: "FAILED", actorRole: "AGENT", actorName: "Priya Singh", notes: "Customer Unavailable - Door locked, phone unanswered after 3 attempts", timestamp: new Date(Date.now() - 40 * 60 * 1000) },
  ];

  for (const h of o3History) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order3.id,
        status: h.status,
        actorRole: h.actorRole,
        actorName: h.actorName,
        notes: h.notes,
        timestamp: h.timestamp,
      },
    });
  }

  // ORDER 4: B2B Freight (PLACED - Ready for Auto-Assignment Demonstration!)
  const order4 = await prisma.order.create({
    data: {
      trackingNumber: "LMD-2026-10004",
      customerId: customerB2B.id,
      senderName: "Acme Warehouse North",
      senderPhone: "+91 98110 66001",
      pickupAddress: "Industrial Shed 12, Adarsh Nagar",
      pickupPincode: "110033",
      pickupArea: "Adarsh Nagar",
      pickupCity: "New Delhi",
      pickupZoneId: zoneNorth.id,
      pickupLat: 28.7242,
      pickupLng: 77.1643,

      recipientName: "Apex Manufacturing Plant",
      recipientPhone: "+91 98110 66002",
      dropAddress: "Block F, Okhla Industrial Area Phase 1",
      dropPincode: "110020",
      dropArea: "Okhla Industrial Area",
      dropCity: "New Delhi",
      dropZoneId: zoneSouth.id, // Inter-zone!
      dropLat: 28.5298,
      dropLng: 77.2711,

      lengthCm: 80,
      widthCm: 60,
      heightCm: 50,
      actualWeightKg: 18.0,
      volumetricWeightKg: 48.0, // (80*60*50)/5000 = 48 kg billable!
      billableWeightKg: 48.0,

      orderType: "B2B",
      paymentType: "PREPAID",
      itemDescription: "Precision CNC Machine Components (Pallet Box)",
      declaredValue: 85000,

      baseCharge: 250.0, // B2B Inter-zone base
      weightCharge: 456.0, // (48 - 10) * $12/kg = $456
      codCharge: 0.0,
      taxAmount: 0.0,
      totalAmount: 706.0,

      status: "PLACED",
      deliveryNotes: "Forklift required for loading and offloading at bay 3.",
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order4.id,
      status: "PLACED",
      actorRole: "CUSTOMER",
      actorName: "Acme Industrial Supplies",
      notes: "B2B Inter-zone shipment created. Volumetric weight: 48 kg.",
    },
  });

  console.log("Created 4 Diverse Sample Orders across full lifecycle.");

  console.log("✅ Database Seed Completed Successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Credentials:");
  console.log("  • Admin:    admin@deliverytracker.com   / admin123");
  console.log("  • Customer: customer@gmail.com          / customer123");
  console.log("  • B2B:      b2b@acmecorp.com            / customer123");
  console.log("  • Agent 1:  agent.rajesh@deliverytracker.com / agent123");
  console.log("  • Agent 2:  agent.amit@deliverytracker.com   / agent123");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
