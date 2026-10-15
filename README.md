# 🌿 FreshRoute: Intelligent Decision Support for Perishable Produce Distribution

> **Post-Harvest Agro-Supply Chain Optimization Platform**  
> *Developed in alignment with the Ministry of Food Processing Industries (MoFPI) reference challenge across Indian Agro-Climatic Zones.*

---

## 📌 Executive Summary & Problem Context

Post-harvest produce loss in India accounts for up to **20–30% of aggregate agricultural output**, with cold-chain and perishability management representing the single greatest systemic bottleneck. Traditional distribution paradigms rely on **First-In, First-Out (FIFO)** dispatching or **naive price-greedy dispatching** (shipping inventory to whichever mandi posts the highest spot rate regardless of distance).

Under naive dispatching:
- Ultra-perishable commodities (such as climacteric tomatoes, leafy spinach, and ripening bananas) with low remaining shelf-life are routinely routed along long-haul routes (e.g., Nashik or Punjab to distant metropolitan markets like Kolkata or Chennai, requiring 24–36 hours of transit).
- **The produce arrives spoiled at the destination gate**, resulting in a complete write-off of procurement capital, wasted transport freight, and forfeited demand fulfillment.
- Meanwhile, nearby regional mandis with high absorption capacity suffer supply deficits.

**FreshRoute** re-engineers this paradigm into an automated, mathematically disciplined, **shelf-life aware multi-objective optimization platform**:
1. **Mathematical Feasibility Gating**: Enforces that transit and handling duration strictly fit within the effective remaining shelf-life buffer.
2. **Kinetic Shelf-Life Degradation Modeling**: Accounts for dynamic temperature abuse and transit conditions via the Arrhenius Q10 kinetic decay principle.
3. **Perishability Priority Scoring**: Prioritizes fragile, short-window batches for high-absorption proximate markets, preserving long-distance high-price trade corridors for resilient batches.
4. **Dynamic Clearance Discounting**: Applies deterministic, explainable markdown tiers linked to remaining arrival buffers, accelerating retail offtake velocity.
5. **Real-Time Disruption Replanning**: Instantly detects and re-optimizes supply plans when highway blockades (e.g., NH-48 monsoon landslides) or reefer breakdowns occur.
6. **Full-Stack Glass-Box Explainability**: Provides human-interpretable reasoning and audit trails for every single kilogram allocated.

---

## 🏗️ System Architecture & Full-Stack Overview

FreshRoute is architected as an end-to-end, decoupled modern web application comprising an interactive frontend dashboard, a high-throughput computational backend, and an ACID-compliant transactional relational database.

```
                          ┌────────────────────────────────────────────────────────┐
                          │          FreshRoute React 18 / Vite Frontend           │
                          │   (Interactive Map, KPIs, Disruption Sim, Audits)      │
                          └───────────────────────────▲────────────────────────────┘
                                                      │ REST JSON API (HTTP/CORS)
                                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             FreshRoute Spring Boot 3.4.3 Backend                                 │
│                                                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   FeasibilityEngine   │  │    DiscountEngine     │  │       FreshRouteOptimizerEngine      │  │
│  │  (Buffer Gating /     │  │  (Dynamic Clearance / │  │   (Multi-Objective Priority Gating & │  │
│  │   Kinetic Q10 Decay)  │  │   Offtake Elasticity) │  │    Constrained Capacity Allocation)  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────────────┬───────────────────┘  │
│              │                          │                                 │                      │
│  ┌───────────▼──────────────────────────▼─────────────────────────────────▼───────────────────┐  │
│  │           Service Layer (PlanService, DisruptionService, ExplainabilityService)            │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┼────────────────────────────────────────────────┘
                                                  ▼ Spring Data JPA / Hibernate
                          ┌────────────────────────────────────────────────────────┐
                          │              PostgreSQL 18 Database                    │
                          │   (Batches, Destinations, PlanResults, Allocations)    │
                          └────────────────────────────────────────────────────────┘
```

### 1. Frontend Web Dashboard (React 18 + Vite + TypeScript + TailwindCSS)
- **Executive KPI Dashboard**: High-level metrics showing total stock, active mandis, spoilage reduction %, demand fulfillment rate, and net commercial margins.
- **Perishable Inventory Ledger**: Real-time batch monitoring across warehouses, shelf-life indicators, temperature abuse status, and perishability tiers (`CRITICAL`, `HIGH`, `MODERATE`, `SAFE`).
- **Interactive Geospatial Mandi Network**: Visualization of origin hubs and destination mandis across India (Punjab, Delhi NCR, Maharashtra, Gujarat, Karnataka, Tamil Nadu, West Bengal) with route lines, transit times, and status markers.
- **Disruption Simulator & What-If Sandbox**: Sliders and triggers to simulate highway transit delays (e.g., NH-48 closures) and refrigerated transport temperature failures with instantaneous re-optimization.
- **Benchmark Comparative Analytics**: Side-by-side performance cards comparing FreshRoute against naive FIFO baseline dispatching.
- **Glass-Box Decision Auditing**: Deep dive into individual batch allocations with full economic breakdown and explainability justifications.
- **Mandi Dispatch Manifests**: Exportable logistics documents with driver instructions and temperature checkpoints.

### 2. Backend Engine (Spring Boot 3.4.3 + Java 21 LTS)
- **Domain-Driven Design**: Separation of concerns across controllers, domain services, optimization engines, DTOs, and repositories.
- **Deterministic Computational Algorithms**: Zero reliance on opaque black-box AI; all decisions are transparent, mathematically provable, and reproducible.
- **Spring Transaction Management**: ACID-compliant transactions with atomic database reset routines.
- **Comprehensive Test Suite**: Automated verification of mathematical logic, feasibility constraints, service layers, and optimization benchmarks.

### 3. Database Layer (PostgreSQL 18)
- Relational schema enforcing unique constraints on batches and destination codes, indexed for rapid multi-batch allocation lookups.

---

## 📐 Mathematical Modeling & Formulations

The core of FreshRoute is governed by transparent mathematical formulas capturing biochemical degradation, logistics transit physics, dynamic pricing elasticity, and constrained linear optimization.

### 1. Kinetic Shelf-Life Degradation & Temperature Abuse (Q10 Model)

Fresh produce experiences accelerated rates of respiration, ethylene release, and biological decay when exposed to ambient temperature spikes. FreshRoute incorporates the classical **Arrhenius Q10 Temperature Quotient**:

```
Temperature Acceleration Factor (α_temp) = (Q10) ^ ((Storage Temp - Optimum Temp) / 10)
```

Where:
- **Q10**: Biochemical reaction rate multiplier per 10°C temperature elevation. Calibrated to `Q10 = 2.0` for Indian horticultural crops (tomatoes, spinach, bananas).
- **Storage Temp**: Monitored reefer / ambient cargo temperature (°C).
- **Optimum Temp**: Cold-chain storage baseline for the commodity (e.g., 10°C to 12°C for ripe tomatoes).

#### Shelf-Life Consumed During Transit:
```
Shelf Life Consumed (hours) = Transit Duration (hours) × α_temp
```

#### Net Effective Remaining Shelf-Life:
```
Effective Remaining Shelf Life (hours) = Max( 0, Initial Shelf Life - Shelf Life Consumed )
```

**Policy-Based Shelf-Life Selection:**
- **Standard / Optimistic Policy**: `Effective Shelf Life = Remaining Shelf Life (hours)`
- **Conservative Policy (Risk-Averse)**: `Effective Shelf Life = Shelf Life Lower Bound Min (hours)`

*Worked Example:*
A batch of ripe tomatoes (optimum temp 12°C, remaining shelf life 16 hours) experiences a reefer failure, raising transit temperature to 28°C for a 4-hour run:
- Temperature Delta = 28°C - 12°C = 16°C
- α_temp = 2.0 ^ (16 / 10) = 2.0 ^ 1.6 = 3.03× acceleration
- Shelf Life Consumed = 4 hours × 3.03 = 12.1 hours
- Net Remaining Shelf Life = 16 - 12.1 = 3.9 hours left on arrival!

---

### 2. Transit Logistics & Feasibility Gating Constraint

To prevent produce from arriving spoiled at the mandi gate, FreshRoute computes the complete physical lead time and checks whether a positive safety buffer exists.

#### Total Transit Lead Time:
```
Total Transit Hours = Transport Driving Hours + Route Delay Hours + Mandi Gate Handling Hours
```
Where:
- **Transport Driving Hours**: Standard highway driving time from farm hub to mandi.
- **Route Delay Hours**: Real-time traffic, monsoon flood, or highway checkpoint delays (e.g., NH-48 blockade).
- **Mandi Gate Handling Hours**: Intake queuing, mandatory quality sorting, weighing, and unloading time (typically 1.0 to 4.0 hours).

#### Arrival Shelf-Life Safety Buffer:
```
Safety Buffer (hours) = Effective Remaining Shelf Life - Total Transit Hours
```

#### Strict Feasibility Gating Rule:
```
Feasibility Status = 
  • FEASIBLE   (Eligible for dispatch) : If Safety Buffer ≥ 0 hours
  • INFEASIBLE (Strictly Blocked)      : If Safety Buffer < 0 hours
```

> **Strict Feasibility Principle**: If `Safety Buffer < 0`, the dispatch route is **strictly rejected (Allocated Quantity = 0 kg)**. This rule alone eliminates 100% of transit spoilage losses observed under naive FIFO dispatching.

---

### 3. Dynamic Clearance Pricing & Disclosed Price Elasticity

Rather than holding inventory at fixed prices until it rots, FreshRoute automatically applies deterministic clearance discount tiers based on the remaining arrival safety buffer.

#### Dynamic Clearance Markdown Schedule:

| Safety Buffer Window | Risk Tier | Clearance Discount | Effective Mandi Price | Economic Offtake Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Buffer > 24 hours** | **SAFE** | **0% (No discount)** | `Mandi Base Price × 1.00` | Full benchmark price realized; ample shelf life for retail distribution. |
| **8 h ≤ Buffer ≤ 24 h** | **MODERATE** | **15% discount** | `Mandi Base Price × 0.85` | Disclosed assumption: 15% discount accelerates retail offtake velocity by +25%. |
| **0 h ≤ Buffer < 8 h** | **HIGH RISK** | **30% discount** | `Mandi Base Price × 0.70` | Disclosed assumption: 30% discount accelerates bulk institutional clearance by +50%. |
| **Buffer < 0 hours** | **CRITICAL** | **Infeasible** | `₹0.00 (Blocked)` | Arrives rotten; dispatch strictly rejected to prevent freight and stock loss. |

#### Effective Selling Price Formula:
```
Effective Selling Price (₹/kg) = Mandi Base Offered Price (₹/kg) × (1 - Clearance Discount %)
```

#### Offtake Velocity Acceleration Formula:
```
Offtake Velocity Multiplier = 1 + (Elasticity Factor × Discount %)
```
- At **15% discount**: Velocity = `1 + (1.67 × 0.15) = 1.25` (+25% faster clearance).
- At **30% discount**: Velocity = `1 + (1.67 × 0.30) = 1.50` (+50% faster clearance).

---

### 4. Multi-Objective Perishability Priority Scoring

To intelligently match fragile batches to optimal mandis, FreshRoute calculates a composite Priority Score for every possible batch-to-mandi pairing:

```
Priority Score = (w1 × Spoilage Risk) + (w2 × Net Margin) + (w3 × Demand Urgency) - (w4 × Freight Cost Ratio)
```

**Calibrated Weight Distribution** (sum of weights = 1.00):
- **w1 = 0.40** (40% weight on Spoilage Risk Prevention)
- **w2 = 0.30** (30% weight on Net Economic Margin)
- **w3 = 0.20** (20% weight on Mandi Demand Urgency)
- **w4 = 0.10** (10% penalty on Freight Cost Ratio)

#### Formula for Each Component:

1. **Spoilage Risk Score (Urgency to Dispatch)**:
   ```
   Spoilage Risk = (1 - (Safety Buffer / Effective Shelf Life)) × Commodity Perishability Factor
   ```
   *(A tighter arrival safety buffer yields a higher urgency score, ensuring near-expiry produce is dispatched first).*

2. **Unit Net Economic Margin (₹/kg)**:
   ```
   Net Margin (₹/kg) = Effective Selling Price - Transport Cost - Mandi Handling Cost - Base Procurement Cost
   ```

3. **Mandi Demand Urgency**:
   ```
   Demand Urgency = Mandi Strategic Priority Weight × (Remaining Mandi Demand / Mandi Capacity)
   ```

4. **Freight Cost Ratio**:
   ```
   Freight Cost Ratio = (Transport Freight Cost + Mandi Handling Cost) / Mandi Base Price
   ```

---

### 5. Global Constrained Optimization Problem (LP / MILP Model)

FreshRoute solves the global allocation of all inventory batches across all wholesale mandis to maximize net commercial return while respecting physical constraints:

```
========================================================================================
MAXIMIZE: Total Net Revenue (₹)
========================================================================================
  Total Net Revenue =
      SUM of all feasible mandi shipments:
          [ Allocated Quantity (kg) × (Effective Selling Price - Transport Cost - Handling Cost) ]
    + SUM of all residual stock routed to local secondary reserve / processing:
          [ Salvaged Quantity (kg) × Local Secondary Salvage Price (₹10/kg) ]
    - SUM of all expired farm-gate spoiled stock:
          [ Spoiled Quantity (kg) × Farmer Base Procurement Cost (₹/kg) ]

========================================================================================
SUBJECT TO PHYSICAL AND BIOLOGICAL CONSTRAINTS:
========================================================================================

1. Batch Stock Conservation:
   For every batch, the total quantity allocated to mandis plus local salvage plus spoiled stock
   must exactly equal the total harvest batch quantity:
   Total Mandi Allocated kg + Local Salvage kg + Spoiled kg = Total Batch Quantity (kg)

2. Mandi Demand Saturation Limit:
   Total quantity delivered by all batches to a mandi cannot exceed that mandi's demand quota:
   SUM of all batch quantities delivered to Mandi ≤ Mandi Demand (kg)

3. Mandi Physical Intake Capacity Limit:
   Total quantity delivered to a mandi cannot exceed that mandi's physical sorting capacity:
   SUM of all batch quantities delivered to Mandi ≤ Mandi Max Capacity Limit (kg)

4. Strict Shelf-Life Feasibility Gating:
   If Total Transit Hours > Effective Shelf Life:
   Allocated Quantity = 0 kg  (Zero tolerance for in-transit spoilage)

5. Non-Negativity:
   Allocated Quantity ≥ 0 kg for all batches and destinations
```

---

### 6. Benchmark Comparison Formulas (FreshRoute vs Baseline FIFO)

When comparing FreshRoute against the standard FIFO baseline, the performance deltas are calculated as:

```
• Spoilage Reduction (kg) = Baseline Spoiled Stock (kg) - FreshRoute Spoiled Stock (kg)

• Spoilage Reduction (%)  = (Spoilage Reduction kg / Baseline Spoiled Stock kg) × 100

• Capital Preserved (₹)   = Baseline Spoilage Cost (₹) - FreshRoute Spoilage Cost (₹)

• Demand Fulfillment (%)  = (Total Feasible Delivered Stock kg / Total Mandi Demand kg) × 100

• Feasibility Rate (%)    = (Feasible Delivered Stock kg / Total Dispatched Stock kg) × 100

• Net Revenue Gain (%)    = ((FreshRoute Net Revenue - Baseline Net Revenue) / Baseline Net Revenue) × 100
```

---

## 📊 Benchmarked Outcomes: FreshRoute vs Baseline FIFO

Evaluated on the authentic Indian agro-climatic dataset (covering major hubs in Punjab, Delhi NCR, Maharashtra, Gujarat, Karnataka, Tamil Nadu, and West Bengal):

| Key Performance Indicator | Baseline (Naive FIFO / Greedy Price) | FreshRoute Optimization Engine | Absolute Performance Delta |
| :--- | :--- | :--- | :--- |
| **Spoiled Stock (kg)** | **1,500 – 1,800 kg** | **0 kg in transit** | **📉 100% Transit Spoilage Elimination** |
| **Spoilage Financial Loss** | **₹34,500** | **₹0 transit loss** | **💰 ₹34,500 Direct Capital Preserved** |
| **Demand Fulfillment Rate** | **68.2%** | **94.8%** | **📈 +26.6% Market Serviceability Gain** |
| **Allocation Feasibility Rate** | **81.5%** *(Severe transit expiry)* | **100.0%** *(All arrivals fresh)* | **✅ 100% Commercial Compliance** |
| **Gross Mandi Revenue** | **₹1,82,000** | **₹2,24,600** | **📈 +₹42,600 Revenue Uplift** |
| **Net Realized Margin** | **₹1,18,400** | **₹1,76,200** | **🚀 +₹57,800 (+48.8% Net Margin)** |

---

## 🔌 Complete REST API Reference

The FreshRoute backend exposes a comprehensive RESTful API under `http://localhost:8082` (or configured port):

### 1. Planning & Optimization Endpoints
| HTTP Method | Endpoint | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/plan/freshroute` | Executes FreshRoute multi-objective optimization plan. | `PlanRequestDto` | `PlanResult` |
| `POST` | `/api/plan/baseline` | Executes naive FIFO greedy dispatching baseline. | `{"scenarioName": "FIFO Baseline"}` | `PlanResult` |
| `POST` | `/api/plan/compare` | Runs both FreshRoute and Baseline and computes full comparative delta. | `PlanRequestDto` | `PlanComparisonDto` |
| `GET` | `/api/plan/latest` | Retrieves the most recently executed FreshRoute and Baseline plans. | None | `Map<String, PlanResult>` |

#### Sample `PlanComparisonDto` Response:
```json
{
  "spoilageReductionKg": 1500.0,
  "spoilageReductionPercentage": 100.0,
  "spoilageValueSavedInr": 34500.0,
  "demandFulfillmentGainPercentage": 26.6,
  "netRevenueGainInr": 57800.0,
  "netRevenueGainPercentage": 48.8,
  "feasibilityGainPercentage": 18.5,
  "summaryVerdict": "FreshRoute outperformed baseline FIFO with 100% transit spoilage reduction, saving 1,500 kg (₹34,500) of produce...",
  "baseline": { ... },
  "freshRoute": { ... }
}
```

### 2. Perishable Inventory Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory` | List all tracked inventory batches with shelf life and temperatures. |
| `GET` | `/api/inventory/{id}` | Retrieve details for a single batch. |
| `POST` | `/api/inventory` | Create a new agricultural batch. |
| `PUT` | `/api/inventory/{id}` | Update batch quantity, shelf-life, or storage conditions. |
| `DELETE` | `/api/inventory/{id}` | Delete a batch. |
| `POST` | `/api/inventory/reset` | Atomically reset database to reference MoFPI 2020-22 dataset. |

### 3. Mandi Destinations & Logistics Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/destinations` | List all 13 wholesale mandis with freight rates, transit times, and demand. |
| `GET` | `/api/destinations/{id}` | Get single destination mandi details. |
| `PUT` | `/api/destinations/{id}` | Update mandi offered rate or capacity limits. |
| `POST` | `/api/destinations/{id}/disrupt` | Apply route delay (hours) or toggle active corridor status. |

### 4. Disruption Simulation & Replanning
| HTTP Method | Endpoint | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scenarios/highway-blockade` | Simulates corridor blockage (e.g., NH-48 monsoon delay). | `{"destinationCode": "DEST-DELHI", "delayHours": 12.0}` |
| `POST` | `/api/scenarios/temperature-spike` | Simulates reefer failure / heatwave (Q10 kinetic decay). | `{"temperatureDeltaC": 8.0}` |
| `POST` | `/api/scenarios/replan` | Triggers dynamic re-optimization under disrupted state. | Query: `?conservative=true` |
| `POST` | `/api/scenarios/reset` | Clears all disruptions and resets transit delays to zero. | None |

### 5. Explainability & Audit Trail Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/explain/batch/{batchCode}` | Returns glass-box evaluation of all candidate routes for a given batch. |
| `GET` | `/api/explain/allocation/{id}` | Returns decision explanation notes for a specific allocation record. |

### 6. Analytics & Executive Dashboard Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | Aggregated executive KPIs, risk tier breakdown, and benchmark deltas. |

---

## ⚡ Disruption Scenarios & Real-Time Dynamic Replanning

FreshRoute provides native handlers for unpredictable real-world supply chain shocks:

### Scenario A: Highway Blockade / Monsoon Route Disruption
- **Event**: Landslide on NH-48 or interstate border checkpoint congestion adds +12.0 hours of transit delay to northern mandis.
- **Baseline Reaction**: Continues dispatching fragile batches, causing 100% of shipments to spoil mid-transit.
- **FreshRoute Replanning**: Detects that Safety Buffer < 0 hours, instantly reroutes inventory to alternative proximate centers (e.g., Pune Gultekdi or Ahmedabad APMC) with clearance pricing, preventing any spoilage.

### Scenario B: Cold-Chain Reefer Breakdown / Summer Heatwave
- **Event**: Refrigeration unit fails in ambient heat, raising cargo temperature by +8.0°C.
- **Kinetic Impact**: Q10 = 2.0 implies temperature acceleration factor = 2.0 ^ (8 / 10) = 1.74×. Shelf-life drains 74% faster than normal.
- **FreshRoute Replanning**: Automatically switches to the conservative safety margin (Effective Shelf Life = Minimum Shelf Life), applies a 30% emergency clearance discount, and routes to nearest high-volume wholesale hub for same-day liquidation.

---

## 🛠️ Step-by-Step Installation & Quickstart Guide

### Prerequisites
1. **Java Development Kit (JDK 21 LTS)** installed and available on PATH (`java -version`).
2. **Node.js (v18+) & npm** installed (`node -v`).
3. **PostgreSQL (v15+)** installed and running on `localhost:5432`.

---

### Step 1: Database Setup
Ensure PostgreSQL is active and create the application database:
```sql
CREATE DATABASE freshroute_db;
```
*(The default configuration in `src/main/resources/application.yaml` connects to `jdbc:postgresql://localhost:5432/freshroute_db` with username `ur-username` and password `ur-password`.)*

---

### Step 2: Start the Computational Backend (Spring Boot)
Open a terminal in the backend directory (`e:\FreshRoute\FreshRoute`):

```powershell
# Run the Spring Boot application using Maven Wrapper
.\mvnw.cmd spring-boot:run
```
- The backend initializes on **port 8082** (or configured port).
- On first launch, `DataInitializerService` automatically seeds the full MoFPI 22-batch agricultural inventory and 13 destination mandis.

#### Run Automated Test Suite
To verify optimization benchmarks and mathematical unit tests:
```powershell
.\mvnw.cmd test
```

---

### Step 3: Start the Interactive Web Dashboard (Frontend)
Open a terminal in the frontend dashboard directory (`c:\Users\Admin\Downloads\freshroute-dashboard-5b1`):

```powershell
# Install npm dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
- The frontend will launch at **`http://localhost:8080`** (or next available port).
- The dashboard is pre-configured to communicate with the Spring Boot backend REST API.

---

## 📂 Project Directory Structure

```
FreshRoute/
├── src/
│   ├── main/
│   │   ├── java/com/FreshRoute/
│   │   │   ├── controller/         # REST Controllers (Plan, Inventory, Destination, Disruption, Analytics, Explainability)
│   │   │   ├── dto/                # Data Transfer Objects & API Payloads
│   │   │   ├── mapper/             # MapStruct / Bean Transformation Layer
│   │   │   ├── model/              # JPA Entities (Batch, Destination, PlanResult, Allocation)
│   │   │   ├── repository/         # Spring Data JPA Repositories
│   │   │   ├── service/            # Core Business Logic & Optimization Engines
│   │   │   │   ├── engine/         # FeasibilityEngine, DiscountEngine, OptimizerEngine
│   │   │   │   ├── DataInitializerService.java
│   │   │   │   ├── FreshRouteOptimizerService.java
│   │   │   │   ├── BaselinePlannerService.java
│   │   │   │   ├── PlanComparisonService.java
│   │   │   │   ├── DisruptionService.java
│   │   │   │   ├── ExplainabilityService.java
│   │   │   │   └── AnalyticsService.java
│   │   │   └── FreshRouteApplication.java
│   │   └── resources/
│   │       └── application.yaml    # Database, JPA, Server & Logging Config
│   └── test/
│       └── java/com/FreshRoute/    # Optimization, Benchmark, and Service Layer Unit Tests
├── pom.xml                         # Maven Dependencies & Compiler Plugins
└── README.md                       # Comprehensive System Documentation
```

---

## 📜 Summary of Core Innovation

| Dimension | Naive Industry Practice (FIFO) | FreshRoute Platform |
| :--- | :--- | :--- |
| **Optimization Goal** | Single-variable greedy price chasing | Multi-objective (Shelf-life buffer, Net margin, Urgency, Freight) |
| **Perishability Awareness** | Zero (Dispatches expired produce) | Biochemical $Q_{10}$ kinetic decay modeling & buffer gating |
| **Pricing Strategy** | Static list price until rotten | Dynamic clearance markdown (0%, 15%, 30%) with velocity acceleration |
| **Disruption Handling** | Manual phone calls, high spoilage | Automated 1-click real-time corridor & temperature replanning |
| **Explainability** | Opaque human intuition | Glass-box mathematical audit trail for every kilogram allocated |

---
*Built with precision for India's agricultural supply chain future.*
