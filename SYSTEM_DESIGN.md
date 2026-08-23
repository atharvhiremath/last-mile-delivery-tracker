# System Design Document: Last-Mile Delivery Management Platform

## 1. Executive Summary & Architecture Overview
The Last-Mile Delivery Management Platform is an end-to-end logistics platform engineered to handle real-time delivery lifecycle workflows: automated geometric zone detection, dynamic volumetric rate calculation, intelligent multi-factor agent allocation, immutable event-sourced order tracking, customer-driven failure recovery, and cross-channel notifications.

The system is architected as a modular service-oriented layer atop Next.js (Full-Stack TypeScript), Prisma ORM, and relational persistence.

```
+---------------------------------------------------------------------------------------+
|                                    Frontend Layer                                     |
|    - Customer Portal        - Delivery Agent Mobile View     - Admin Operations Deck  |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                  Backend Engine Core                                  |
|  [Rate Engine] <---> [Zone Engine] <---> [Assignment Engine] <---> [Tracking Engine]  |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                Relational Data Layer                                  |
|   - Users (RBAC)            - Delivery Agents (Fleet GPS)    - Zones & Area Pincodes  |
|   - Rate Cards (B2B/B2C)    - Orders (Audit Snapshots)       - OrderStatusHistory     |
+---------------------------------------------------------------------------------------+
```

---

## 2. Rate Calculation Engine Design
Logistics profitability requires dynamic billing based on cargo cubic volume and vehicle payload constraints.

### 2.1 Volumetric & Billable Weight Determination
Volumetric weight is computed using the international air/road freight standard:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$

The billable weight is determined by selecting the higher value between actual physical weight and cubic volumetric weight:
$$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### 2.2 Dynamic Rate Card Lookup (Zero Hardcoding)
Rates are fully dynamic and configurable in the database via the Admin Console. The calculation engine queries active `RateCard` entities indexed by `(OrderType: B2B/B2C, ZoneScope: INTRA_ZONE/INTER_ZONE)`.

$$\text{Weight Charge} = \text{Base Rate} + \left( \max(0, \text{Billable Weight} - \text{Base Weight}) \times \text{Per-Kg Rate} \right)$$

### 2.3 COD Surcharge & Pricing Transparency
For Cash-on-Delivery (`COD`) orders, cash handling risk is factored in:
$$\text{COD Charge} = \max\left(\text{Fixed COD Surcharge}, \text{Min Surcharge}, \text{Declared Value} \times \frac{\text{COD \% Surcharge}}{100}\right)$$

Total calculated charges are returned as an itemized breakdown with full mathematical explanations for pre-confirmation quotation.

---

## 3. Zone Detection Approach
Geographic delivery routing resolves physical addresses to operational logistical hubs.

1. **Pincode & Postal Lookup**: Address postal codes are matched against the `AreaPincode` relational mapping.
2. **Centroid Geocoding Fallback**: If a custom address is outside indexed pincodes, the engine calculates the great-circle Haversine distance between customer coordinates $(\phi_1, \lambda_1)$ and active zone centroids $(\phi_2, \lambda_2)$:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
3. **Zone Scope Classification**:
   - $\text{Pickup Zone ID} == \text{Drop Zone ID} \implies \textbf{INTRA\_ZONE}$ (Local fleet routing).
   - $\text{Pickup Zone ID} \neq \text{Drop Zone ID} \implies \textbf{INTER\_ZONE}$ (Cross-hub logistics).

---

## 4. Intelligent Auto-Assignment Logic
The auto-assignment engine evaluates candidate delivery agents to minimize transit time while balancing fleet workload.

### 4.1 Candidate Filtering
- Agent `isAvailable == true` (Agent toggled online).
- Agent `currentActiveLoad < maxCapacity` (Agent has capacity).

### 4.2 Multi-Factor Scoring Heuristic
Each eligible agent is scored based on proximity, operating zone alignment, and load balancing:
$$\text{Score} = \text{DistanceToPickup (km)} + (\text{ActiveLoad} \times 0.5) - (\text{ZoneMatchBonus} = 2.0)$$
*(Lower score is better).*

The optimal agent is assigned in an atomic database transaction, incrementing agent active load and transitioning order status to `ASSIGNED`.

---

## 5. Order Status Lifecycle & Immutable History
Order progress is governed by a finite state machine preventing invalid state transitions:
$$\text{PLACED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED} \text{ / } \text{FAILED}$$

### 5.1 Immutable Audit Trail
Every status transition generates a non-destructive, append-only `OrderStatusHistory` record containing:
`orderId`, `status`, `previousStatus`, `actorId`, `actorRole`, `actorName`, `notes`, `geoCoordinates`, and `timestamp`.

---

## 6. Failed Delivery & Customer Reschedule Flow
1. **Failure Tagging**: When a delivery fails (e.g. customer unavailable, incorrect address), the agent provides a mandatory reason.
2. **Capacity Release**: The order transitions to `FAILED`, and the agent's active load is decremented immediately.
3. **Automated Notification**: An alert is dispatched via email and SMS containing a secure reschedule link.
4. **Customer Rescheduling**: The customer selects a new delivery date, preferred time slot, and delivery instructions.
5. **Reassignment Trigger**: The order transitions to `RESCHEDULED`, triggering automatic re-assignment to the optimal agent for the new delivery window.
