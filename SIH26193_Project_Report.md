# KrishiMitra AI — SIH26193 Project Report

## Smart India Hackathon 2025-26

**Problem Statement ID:** SIH26193
**Theme:** Agriculture, FoodTech & Rural Development
**Category:** Software
**Title:** Developing solutions to enhance the primary sector of India — Agriculture, and to manage and process our agriculture produce

**Team Project:** KrishiMitra AI ("Farmer's Friend")

---

## Table of Contents

1. [Problem Statement Analysis](#1-problem-statement-analysis)
2. [Current Project Overview](#2-current-project-overview)
3. [Existing Features — Detailed Breakdown](#3-existing-features--detailed-breakdown)
4. [System Architecture & Technology Stack](#4-system-architecture--technology-stack)
5. [Current Data Flow Diagrams](#5-current-data-flow-diagrams)
6. [Gap Analysis](#6-gap-analysis)
7. [Recommended Features — Tier 1 (Must-Have)](#7-recommended-features--tier-1-must-have)
8. [Recommended Features — Tier 2 (Strongly Recommended)](#8-recommended-features--tier-2-strongly-recommended)
9. [Recommended Features — Tier 3 (Bonus/Differentiator)](#9-recommended-features--tier-3-bonusdifferentiator)
10. [Proposed Data Flow Diagrams for New Features](#10-proposed-data-flow-diagrams-for-new-features)
11. [Enhancements to Existing Features](#11-enhancements-to-existing-features)
12. [Implementation Roadmap & Priority Matrix](#12-implementation-roadmap--priority-matrix)
13. [Final Alignment Score & Conclusion](#13-final-alignment-score--conclusion)

---

## 1. Problem Statement Analysis

The SIH26193 problem statement has two explicit pillars:

### Pillar 1: Enhance the Primary Sector (Agriculture)
> Improving farming practices, productivity, crop health, input management, and farmer decision-making.

### Pillar 2: Manage and Process Agriculture Produce
> Post-harvest management, storage, processing, supply chain tracking, market access, quality assessment, and connecting farmers to buyers/processors.

Both pillars are **mandatory** for a complete solution. A project that only addresses Pillar 1 covers roughly half the problem statement.

---

## 2. Current Project Overview

**KrishiMitra AI** is an AI-powered agricultural intelligence platform built primarily for farmers in Odisha and across India. It combines real-device computer vision, real-time geolocation weather, direct marketplace purchasing, verified dealer communications, and 5 cutting-edge agricultural AI engines.

### Platform Identity

| Attribute | Detail |
|-----------|--------|
| **Name** | KrishiMitra AI ("Farmer's Friend") |
| **Primary Users** | Farmers, Agro-Dealers, Administrators |
| **Geographic Focus** | Odisha, India (scalable nationally) |
| **Languages Supported** | English, Odia, Hindi, Bengali, Telugu, Tamil, Kannada, Marathi |
| **Pillar Coverage** | Pillar 1 (Strong), Pillar 2 (Missing) |

---

## 3. Existing Features — Detailed Breakdown

### 3.1 Crop Disease Diagnosis (`/analyze`)

| Aspect | Detail |
|--------|--------|
| **Input** | Camera photo or gallery upload of crop leaf |
| **AI Model** | LMM (Large Multimodal Model) based disease identification |
| **Output** | Disease name, severity rating, symptoms, organic & chemical remedies |
| **Languages** | Multi-lingual voice readout via Web Speech API |
| **Crops Supported** | Paddy, Tomato, Mustard, Potato, Maize, Brinjal, Chilli, Other |

### 3.2 Soil Health Assessment (`/soil-analysis`)

| Aspect | Detail |
|--------|--------|
| **Input** | Camera photo of farm soil |
| **AI Analysis** | Soil texture, NPK deficiency detection, fertility rating |
| **Output** | Soil type, nitrogen/phosphorus/potassium levels, suitable crop recommendations |
| **Audio** | Text-to-speech readout of results |

### 3.3 Weather & Farming Advisories (`/weather`)

| Aspect | Detail |
|--------|--------|
| **Input** | Auto-detected GPS location via Nominatim reverse geocoding |
| **Data Source** | Real-time weather API with 5-day forecast |
| **Output** | Temperature, humidity, wind speed, rain probability, agricultural advisories |
| **Advisory Types** | Irrigation scheduling, pest risk alerts, harvest window guidance |

### 3.4 Agricultural Marketplace (`/products`)

| Aspect | Detail |
|--------|--------|
| **Categories** | Fertilizer, Pesticide, Organic, Seeds, Tools |
| **Integration** | Direct purchase links to Amazon India and Flipkart |
| **Features** | Search, category filtering, price display in INR (₹), rating display |
| **Products** | Neem oil, Trichoderma bio-fungicide, NPK fertilizers, sticky traps, vermicompost, drip irrigation kits |

### 3.5 Verified Dealer Connect (`/dealers`)

| Aspect | Detail |
|--------|--------|
| **Dealer Directory** | Verified agro-dealers across Odisha districts |
| **Communication** | Direct phone call (`tel:`), WhatsApp messaging (`wa.me/`), in-app real-time chat via Socket.IO |
| **Dealer Portal** | Separate dashboard for dealers to respond to farmer crop issues |

### 3.6 AI Chat Assistant (`/assistant`)

| Aspect | Detail |
|--------|--------|
| **Input** | Text or voice (Web Speech Recognition) |
| **Backend** | Express.js API with fallback to local farming knowledge base |
| **Languages** | 8 Indian languages |
| **Audio** | Text-to-speech readout of all responses |
| **Suggested Queries** | Disease control, fertilizer advice, seasonal crop selection, pest management, government schemes, irrigation setup |

### 3.7 Crop Issue Posting (`/post-crop`)

| Aspect | Detail |
|--------|--------|
| **Function** | Farmers post crop problems with photos to local dealer network |
| **Output** | Dealers review and prescribe solutions |

### 3.8 Farmer & Dealer Dashboards

| Aspect | Detail |
|--------|--------|
| **Farmer Dashboard** | Weather widget, recent diagnoses, quick actions (scan crop, post issue) |
| **Dealer Dashboard** | Incoming farmer posts, response modal, chat access, verification badge |

### 3.9 Five Advanced AI Intelligence Engines

#### Engine 1: Digital Twin (`/digital-twin`)

| Aspect | Detail |
|--------|--------|
| **Function** | Real-time virtual replica of farm state |
| **Parameters** | Soil pH, topsoil moisture (0-5cm), root-zone moisture (10-30cm), NPK mg/kg, biomass NDVI, canopy temperature, vapor pressure deficit |
| **Visualization** | Interactive vertical soil depth horizon viewer |
| **Real-time** | IoT sensor pulse simulation with WebSocket updates and graph history |

#### Engine 2: Multi-Agent Consensus System (`/consensus-engine`)

| Aspect | Detail |
|--------|--------|
| **Architecture** | LangGraph/CrewAI multi-agent deliberation |
| **Agents** | Agronomy & Crop Health, Meteorology & Climate Risk, Hydrology & Irrigation, Agro-Economics & Farmer Budget |
| **Arbiter** | Synthesizes conflicting debates into unified step-by-step action plan |
| **Output** | Consensus score (0-100%), agent-specific recommendations, final action plan |

#### Engine 3: What-If Predictive Crop Simulator (`/what-if-simulation`)

| Aspect | Detail |
|--------|--------|
| **Parameters** | Temperature deviation (-3°C to +6°C), dry spell days (0-25), excess rainfall (0-100mm), irrigation supply (0-200%), pest pressure level |
| **Output** | 14-day soil moisture decay projection, NDVI stress trajectories, yield deviation %, financial impact (₹/acre), crop stress index |
| **Features** | Quick scenario presets (heatwave, cyclone, optimal), wilting threshold detection |

#### Engine 4: Agronomy RAG Knowledge Base (`/agronomy-rag`)

| Aspect | Detail |
|--------|--------|
| **Data Sources** | ICAR, OUAT (Odisha University of Agriculture & Technology), FAO research manuals |
| **Function** | Vector-embedded knowledge store with grounding confidence scoring |
| **Guardrails** | Chemical dosage upper-bound enforcement, banned agrochemical filtering (CIBRC compliance) |
| **Output** | Grounded answer, cited literature excerpts, safety verification checks |

#### Engine 5: GIS Field Mapping (`/field-mapping`)

| Aspect | Detail |
|--------|--------|
| **Map Engine** | Leaflet with OpenStreetMap tiles |
| **Function** | Draw field boundary polygons via click-to-place vertices |
| **Calculations** | Area (acres, hectares, guntha), perimeter, centroid GPS |
| **Satellite Overlays** | NDVI biomass spectrum, soil moisture band, disease risk zones |
| **Sync** | One-click plot synchronization to Digital Twin |

---

## 4. System Architecture & Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 6.0 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling |
| Leaflet | 1.9 | GIS mapping |
| Lucide React | 0.475 | Icons |
| Socket.IO Client | 4.8 | Real-time communication |
| Axios | 1.7 | HTTP client |
| React Router DOM | 6.28 | Client-side routing |

### Backend Stack
| Technology | Purpose |
|------------|---------|
| Express.js | REST API server |
| Node.js | Runtime |
| Socket.IO Server | WebSocket real-time messaging |
| Prisma ORM | Database ORM |
| SQLite | Database |
| Multer | File upload handling |
| Nominatim | Reverse geocoding |
| Web Speech API | Voice recognition & synthesis |
| MediaDevices API | Camera access |

### Current Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ React   │  │ Tailwind │  │ Leaflet  │  │ Socket.IO│            │
│  │ Router  │  │   CSS    │  │   GIS    │  │  Client  │            │
│  └────┬────┘  └──────────┘  └────┬─────┘  └────┬─────┘            │
│       │                          │              │                   │
│  ┌────▼──────────────────────────▼──────────────▼─────┐            │
│  │              React Application (SPA)                │            │
│  │  Pages: Dashboard, Analyze, Weather, Products,      │            │
│  │  Dealers, Chat, Digital Twin, Consensus Engine,     │            │
│  │  What-If Simulator, Agronomy RAG, Field Mapping     │            │
│  └──────────────────────┬─────────────────────────────┘            │
│                         │ Axios HTTP + WebSocket                    │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS BACKEND                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ /analysis│  │ /digital │  │/multi-   │  │/simulation│           │
│  │  routes  │  │  -twin   │  │ agent    │  │  /run    │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                  │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐          │
│  │              Business Logic Layer                      │          │
│  │  AI Diagnosis, Weather Aggregation, Consensus Engine,  │          │
│  │  Simulation Engine, RAG Query, Field Mapping          │          │
│  └──────────────────────┬────────────────────────────────┘          │
│                         │                                            │
│  ┌──────────────────────▼────────────────────────────────┐          │
│  │           Prisma ORM + SQLite Database                │          │
│  │  Users, Analysis History, Crop Posts, Dealer Data,     │          │
│  │  Products, Digital Twin State, Consensus Results       │          │
│  └───────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │           External APIs & Services                   │          │
│  │  OpenWeatherMap, Nominatim, Amazon/Flipkart Links,   │          │
│  │  Web Speech API, MediaDevices API                    │          │
│  └──────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Current Data Flow Diagrams

### 5.1 Crop Disease Diagnosis Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Farmer  │     │  Camera  │     │ Frontend │     │ Backend  │     │ AI Model │
│          │     │  Module  │     │  (React) │     │(Express) │     │  (LMM)   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │  1. Open Camera│                │                │                │
     │───────────────>│                │                │                │
     │                │                │                │                │
     │  2. Capture Leaf Photo          │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
     │  3. Preview + Confirm           │                │                │
     │───────────────>│───────────────>│                │                │
     │                │                │                │                │
     │  4. Select Crop Type            │                │                │
     │──────────────────────────────>│                │                │
     │                │                │  5. POST /analysis/diagnose    │
     │                │                │───────────────>│                │
     │                │                │  { cropName, imageData, lang } │
     │                │                │                │  6. Call AI    │
     │                │                │                │───────────────>│
     │                │                │                │                │
     │                │                │                │  7. Disease    │
     │                │                │                │  Response      │
     │                │                │                │<───────────────│
     │                │                │                │                │
     │                │                │  8. Navigate to /analysis/:id  │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │  9. View Results: Disease, Severity, Remedies   │                │
     │<───────────────────────────────│                │                │
```

### 5.2 Digital Twin Pulse Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │ Database │     │ IoT Sim  │
│ (React)  │     │(Express) │     │(SQLite)  │     │  Layer   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. GET /digital-twin          │                │
     │───────────────>│                │                │
     │                │  2. Query State│                │
     │                │───────────────>│                │
     │                │  3. Return     │                │
     │                │<───────────────│                │
     │  4. Render Dashboard           │                │
     │<───────────────│                │                │
     │                │                │                │
     │  5. Click "Pulse"              │                │
     │───────────────>│                │                │
     │                │  6. POST /digital-twin/pulse    │
     │                │───────────────────────────────>│
     │                │  7. Simulate new sensor reading │
     │                │<───────────────────────────────│
     │                │  8. Store Time-Series Point     │
     │                │───────────────>│                │
     │                │                │                │
     │  9. Updated twin + latest graph point           │
     │<───────────────│                │                │
```

### 5.3 Multi-Agent Consensus Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │ Database │
│ (React)  │     │(Express) │     │(SQLite)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │  1. POST /multi-agent/deliberate│
     │  { dilemma, cropName, district }│
     │───────────────>│                │
     │                │                │
     │                │  ┌─────────────▼─────────────┐
     │                │  │   Agent Deliberation       │
     │                │  │   ┌───────────────────┐   │
     │                │  │   │ Agronomy Agent     │   │
     │                │  │   │ (Yield Maximize)   │   │
     │                │  │   └────────┬──────────┘   │
     │                │  │            │               │
     │                │  │   ┌────────▼──────────┐   │
     │                │  │   │ Meteorology Agent  │   │
     │                │  │   │ (Climate Risk)     │   │
     │                │  │   └────────┬──────────┘   │
     │                │  │            │               │
     │                │  │   ┌────────▼──────────┐   │
     │                │  │   │ Hydrology Agent    │   │
     │                │  │   │ (Irrigation)       │   │
     │                │  │   └────────┬──────────┘   │
     │                │  │            │               │
     │                │  │   ┌────────▼──────────┐   │
     │                │  │   │ Economics Agent    │   │
     │                │  │   │ (Budget Optimize)  │   │
     │                │  │   └────────┬──────────┘   │
     │                │  │            │               │
     │                │  │   ┌────────▼──────────┐   │
     │                │  │   │ Consensus Arbiter  │   │
     │                │  │   │ (Synthesize Plan)  │   │
     │                │  │   └────────┬──────────┘   │
     │                │  └─────────────┼─────────────┘
     │                │                │
     │  2. Response: individual agent recommendations  │
     │  + consensus score + unified action plan        │
     │<───────────────│                │
```

### 5.4 Weather Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Browser  │     │ Frontend │     │ Backend  │     │ OpenWeather│
│(GPS API) │     │ (React)  │     │(Express) │     │  Map API   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬───────┘
     │                │                │                │
     │  1. navigator.geolocation      │                │
     │  returns lat, lng              │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │  2. Nominatim Reverse Geocode   │
     │                │───────────────────────────────>│
     │                │  3. City, District, State       │
     │                │<───────────────────────────────│
     │                │                │                │
     │                │  4. GET /weather?city=...       │
     │                │───────────────>│                │
     │                │                │  5. Query API  │
     │                │                │───────────────>│
     │                │                │  6. Weather    │
     │                │                │<───────────────│
     │                │                │  7. Generate   │
     │                │                │  farming       │
     │                │                │  advisories    │
     │                │  8. WeatherData + advisories    │
     │                │<───────────────│                │
     │  9. Render Widget              │                │
     │<───────────────────────────────│                │
```

---

## 6. Gap Analysis

### Alignment Score Summary

| Pillar | Description | Coverage | Score |
|--------|-------------|----------|-------|
| **Pillar 1** | Enhance the primary sector (Agriculture) | Strong — 12 features addressing farming practices, crop health, soil management, weather intelligence, input procurement, and farmer-dealer connectivity | **85%** |
| **Pillar 2** | Manage and process agriculture produce | Weak — No post-harvest, storage, processing, supply chain, or market access features | **10%** |
| **Overall** | **Both pillars combined** | | **~55%** |

### Detailed Gap Breakdown

| Gap Area | Problem Statement Requirement | Current Status | Priority |
|----------|-------------------------------|----------------|----------|
| Post-Harvest Inventory | Track harvested produce, quantities, storage | ❌ Not implemented | 🔴 Critical |
| Market Price Analytics | Mandi prices, price discovery, price prediction | ❌ Not implemented | 🔴 Critical |
| Buyer-Seller Marketplace | Connect farmers directly to buyers/processors | ❌ Not implemented | 🔴 Critical |
| Quality Grading | Assess and grade harvested produce | ❌ Not implemented | 🟡 High |
| Supply Chain Tracking | Track produce from farm to consumer | ❌ Not implemented | 🟡 High |
| Processing Unit Directory | Connect farmers to local food processors | ❌ Not implemented | 🟡 High |
| Logistics & Transport | Book transport for produce movement | ❌ Not implemented | 🟠 Medium |
| Cooperative Management | Group selling, shared expenses | ❌ Not implemented | 🟠 Medium |
| Cold Chain Monitoring | Monitor storage temperature/conditions | ❌ Not implemented | 🟠 Medium |
| Value-Addition Advisory | Advise on processing vs raw selling | ❌ Not implemented | ⚪ Nice-to-have |

---

## 7. Recommended Features — Tier 1 (Must-Have)

These features **directly address Pillar 2** ("manage and process agriculture produce") and are essential for a complete SIH26193 solution.

### 7.1 🌾 Post-Harvest Produce Inventory (`/inventory`)

**Purpose:** Enable farmers to register, track, and manage their harvested agricultural produce.

**Features:**
- Register harvested produce: crop type, quantity (kg/quintal), harvest date, quality grade
- Track storage location (home storage, cooperative warehouse, cold storage)
- Set selling price or receive AI-suggested price based on mandi data
- Visual dashboard showing current stock levels with expiration/shelf-life warnings
- History of sales and remaining inventory
- Photo capture of produce for quality documentation

**User Stories:**
- As a farmer, I want to log my harvested paddy (50 quintals, Grade A) so I can track what I have available for sale
- As a farmer, I want to see which of my produce is approaching shelf-life expiry so I can sell before quality degrades
- As a farmer, I want AI-suggested pricing based on current mandi rates so I don't undersell

### 7.2 📊 Real-Time Mandi Price Dashboard (`/mandi-prices`)

**Purpose:** Provide farmers with live agricultural commodity prices from nearby APMC mandis and e-NAM platform.

**Features:**
- Fetch live mandi prices via government data APIs (data.gov.in, e-NAM integration)
- Display prices for major crops across nearby mandis within configurable radius
- Price trend charts (7-day, 30-day, 90-day historical views)
- AI-powered 7-day price prediction based on weather, season, and historical patterns
- "Best day to sell" advisory combining weather forecast + price trends
- Alert notifications when target price is reached
- Compare prices across multiple mandis to find the best selling location

**Data Sources:**
- Government of India e-NAM (National Agriculture Market) API
- data.gov.in open government data portal
- State-level APMC price feeds

**User Stories:**
- As a farmer, I want to see the current price of paddy at Cuttack, Bhubaneswar, and Puri mandis so I can choose where to sell
- As a farmer, I want a price trend chart so I can decide whether to sell now or wait for better prices
- As a farmer, I want alerts when tomato prices cross ₹25/kg at my nearest mandi

### 7.3 🤝 Direct Buyer-Seller Marketplace (`/marketplace`)

**Purpose:** Create a direct connection between farmers and verified buyers (processors, traders, retailers, restaurants).

**Features:**
- Farmers post available produce with photos, quantity, quality grade, asking price
- Verified buyer profiles (processors, wholesalers, retailers, restaurants, exporters)
- Search and filter by crop, location, quantity range, organic certification
- In-app negotiation chat with offer/counter-offer system
- Order placement, confirmation, and delivery tracking
- Rating and review system for both farmers and buyers
- Dispute resolution mechanism

**User Stories:**
- As a farmer, I want to post my 30 quintals of organic tomato so nearby food processors can see and purchase
- As a buyer (rice mill owner), I want to search for paddy suppliers in Cuttack district within my quality and quantity requirements
- As a restaurant owner, I want to directly buy fresh vegetables from farmers to reduce cost and ensure freshness

---

## 8. Recommended Features — Tier 2 (Strongly Recommended)

These features add significant depth to the Pillar 2 solution and strengthen the overall project.

### 8.1 📸 AI Quality Grading (`/quality-grade`)

**Purpose:** Use computer vision to assess the quality of harvested produce and assign standardized grades.

**Features:**
- Camera-based produce quality assessment (size uniformity, color analysis, defect detection)
- Grade assignment (A/B/C) based on FSSAI (Food Safety and Standards Authority of India) standards
- Price recommendation based on assigned grade
- Comparison: "Grade A fetches 20% more at mandi than Grade B"
- Batch grading for bulk produce
- Reuses existing camera + AI infrastructure from crop diagnosis

**Reusability:** Extends the existing camera capture and AI analysis pipeline already built for crop disease diagnosis.

### 8.2 📦 Supply Chain Tracker (`/supply-chain`)

**Purpose:** Provide end-to-end visibility of produce journey from farm to consumer.

**Features:**
- Track produce journey: Farm → Collection Point → Mandi → Processor → Retailer → Consumer
- QR code generation for each produce batch
- Timestamped status updates at each stage
- Temperature and condition monitoring during transit
- Blockchain-inspired immutable audit trail
- Consumer-facing verification page ("Scan to see where your food came from")

### 8.3 🏭 Processing Unit Directory (`/processors`)

**Purpose:** Connect farmers with local food processing and storage facilities.

**Features:**
- Directory of local food processing units: rice mills, oil expellers, flour mills, cold storage, food packaging units
- Filter by location, capacity, processing type, pricing
- Booking/request system for processing services
- Quality certification display for processing units
- Cost estimation for processing services
- Similar architecture to existing Dealer Directory

### 8.4 🚛 Logistics & Transport Booking (`/logistics`)

**Purpose:** Help farmers book affordable transport for moving produce.

**Features:**
- Book transport from farm to mandi/processor/warehouse
- Rate comparison across local transporters
- Shared transport option for small farmers (cost-splitting with nearby farmers)
- Route optimization
- Delivery tracking
- Integration with supply chain tracker

---

## 9. Recommended Features — Tier 3 (Bonus/Differentiator)

These features provide additional differentiation and impress judges.

### 9.1 📱 Cooperative Management (`/cooperative`)

**Purpose:** Enable farmer groups to collectively manage, sell, and share expenses.

**Features:**
- Form or join farmer cooperatives/groups
- Pool produce for bulk selling at better negotiated prices
- Shared expense tracking (seeds, fertilizers, transport costs)
- Democratic decision-making for collective selling decisions
- Role-based access (President, Treasurer, Member)
- Financial reporting and transparent ledger

### 9.2 🧊 Cold Chain Monitor (`/cold-storage`)

**Purpose:** Monitor and manage cold storage conditions for perishable produce.

**Features:**
- IoT-simulated temperature and humidity monitoring
- Alerts when storage conditions deviate from safe ranges
- Shelf-life prediction based on storage conditions
- Integration with Digital Twin for cold storage facility visualization
- Historical condition logging

### 9.3 🍽️ FoodTech Integration (`/foodtech`)

**Purpose:** Add food technology and value-addition advisory to connect agriculture with food processing.

**Features:**
- Recipe-based demand forecasting (e.g., "tomato demand rises during monsoon for sauce production")
- Processed product catalog (pickles, sauces, dried products made by cooperatives)
- Value-addition advisory: "Selling tomato paste gives 3x more profit than raw tomatoes"
- Nutritional analysis of produce
- Food safety compliance checker

### 9.4 🌐 Government Scheme Integration (`/schemes`)

**Purpose:** Connect farmers with relevant government subsidies, insurance, and welfare schemes.

**Features:**
- Database of central and state government agricultural schemes
- Eligibility checker based on farmer profile
- Application assistance and document preparation
- Scheme status tracking
- PM-KISAN, PM Fasal Bima Yojana, e-NAM registration links

---

## 10. Proposed Data Flow Diagrams for New Features

### 10.1 Post-Harvest Inventory Management Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Farmer  │     │ Frontend │     │ Backend  │     │ Database │
│          │     │ (React)  │     │(Express) │     │(SQLite)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. Navigate to /inventory      │                │
     │───────────────>│                │                │
     │                │  2. GET /inventory              │
     │                │───────────────>│  3. Query      │
     │                │                │───────────────>│
     │                │                │  4. Return     │
     │                │                │<───────────────│
     │                │  5. Render inventory dashboard  │
     │                │<───────────────│                │
     │  6. View stock levels           │                │
     │<───────────────│                │                │
     │                │                │                │
     │  7. Click "Add New Harvest"     │                │
     │───────────────>│                │                │
     │                │                │                │
     │  8. Fill form: crop, qty, photo, storage loc     │
     │───────────────>│                │                │
     │                │  9. POST /inventory             │
     │                │  { cropName, quantity, unit,     │
     │                │    harvestDate, grade, photo,   │
     │                │    storageLocation }            │
     │                │───────────────>│                │
     │                │                │  10. Insert    │
     │                │                │───────────────>│
     │                │                │                │
     │                │  11. Success + updated list     │
     │                │<───────────────│                │
     │  12. View updated inventory     │                │
     │<───────────────│                │                │
     │                │                │                │
     │  13. View AI Price Suggestion   │                │
     │───────────────>│                │                │
     │                │  14. GET /inventory/:id/price-suggestion
     │                │───────────────>│                │
     │                │                │  15. Query mandi prices
     │                │                │  + calculate AI suggestion
     │                │                │<───────────────│
     │                │  16. Suggested price            │
     │                │<───────────────│                │
     │  17. Set price or accept suggestion              │
     │<───────────────│                │                │
```

### 10.2 Mandi Price Dashboard Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│  Farmer  │     │ Frontend │     │ Backend  │     │ e-NAM /    │
│          │     │ (React)  │     │(Express) │     │ data.gov.in│
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬───────┘
     │                │                │                │
     │  1. Navigate to /mandi-prices   │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │  2. GET /mandi-prices           │
     │                │  ?crop=paddy&radius=100km       │
     │                │───────────────>│                │
     │                │                │  3. Fetch live │
     │                │                │  prices from   │
     │                │                │  e-NAM API     │
     │                │                │───────────────>│
     │                │                │  4. Price data │
     │                │                │<───────────────│
     │                │                │                │
     │                │                │  5. Fetch      │
     │                │                │  historical    │
     │                │                │  30-day data   │
     │                │                │───────────────>│
     │                │                │  6. Historical │
     │                │                │<───────────────│
     │                │                │                │
     │                │                │  7. AI Predict │
     │                │                │  7-day forecast│
     │                │                │  (weather +    │
     │                │                │  historical)   │
     │                │                │                │
     │                │  8. Price data + trends +       │
     │                │  predictions + best sell day     │
     │                │<───────────────│                │
     │  9. Render: mandi comparison,   │                │
     │  trend chart, prediction,       │                │
     │  best day advisory             │                │
     │<───────────────│                │                │
```

### 10.3 Buyer-Seller Marketplace Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Farmer  │     │ Frontend │     │ Backend  │     │ Database │
│  / Buyer │     │ (React)  │     │(Express) │     │(SQLite)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  FARMER SIDE: POST PRODUCE     │                │
     │  ─────────────────────────────│                │
     │                │                │                │
     │  1. Click "Sell Produce"       │                │
     │───────────────>│                │                │
     │                │                │                │
     │  2. Fill: crop, qty, grade,    │                │
     │  price, photos, location       │                │
     │───────────────>│                │                │
     │                │  3. POST /marketplace/listings  │
     │                │───────────────>│                │
     │                │                │  4. Insert     │
     │                │                │───────────────>│
     │                │                │                │
     │                │  5. Listing created             │
     │                │<───────────────│                │
     │  6. Listing live on marketplace│                │
     │<───────────────│                │                │
     │                │                │                │
     │  BUYER SIDE: SEARCH & ORDER    │                │
     │  ─────────────────────────────│                │
     │                │                │                │
     │  7. Buyer searches for crops   │                │
     │──────────────────────────────>│                │
     │                │  8. GET /marketplace/listings   │
     │                │  ?crop=paddy&location=...       │
     │                │───────────────>│                │
     │                │                │  9. Query +    │
     │                │                │  filter        │
     │                │                │───────────────>│
     │                │                │  10. Results   │
     │                │                │<───────────────│
     │                │  11. Filtered listings          │
     │                │<───────────────│                │
     │  12. View listings with photos, prices          │
     │<───────────────│                │                │
     │                │                │                │
     │  13. Buyer places order         │                │
     │──────────────────────────────>│                │
     │                │  14. POST /marketplace/orders   │
     │                │───────────────>│                │
     │                │                │  15. Create    │
     │                │                │  order +       │
     │                │                │  notify farmer │
     │                │                │───────────────>│
     │                │                │                │
     │  16. Farmer notified of new order                │
     │<───────────────────────────────│                │
     │                │                │                │
     │  17. Farmer confirms / negotiates               │
     │──────────────────────────────>│                │
     │                │  18. Update order status        │
     │                │───────────────>│                │
     │                │                │                │
     │  19. Order confirmed, delivery tracking active  │
     │<───────────────────────────────│                │
```

### 10.4 AI Quality Grading Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Farmer  │     │  Camera  │     │ Frontend │     │ Backend  │     │ AI Model │
│          │     │  Module  │     │ (React)  │     │(Express) │     │ (Vision) │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │  1. Open Camera│                │                │                │
     │───────────────>│                │                │                │
     │                │                │                │                │
     │  2. Capture produce photo       │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
     │  3. Confirm + select crop type  │                │                │
     │──────────────────────────────>│                │                │
     │                │                │                │                │
     │                │                │  4. POST /quality/grade        │
     │                │                │  { imageData, cropType,        │
     │                │                │    quantity }                  │
     │                │                │───────────────>│                │
     │                │                │                │  5. Analyze   │
     │                │                │                │  image for:   │
     │                │                │                │  - Size       │
     │                │                │                │  - Color      │
     │                │                │                │  - Defects    │
     │                │                │                │  - Uniformity │
     │                │                │                │───────────────>│
     │                │                │                │  6. Analysis  │
     │                │                │                │<───────────────│
     │                │                │                │                │
     │                │                │                │  7. Apply     │
     │                │                │                │  FSSAI grade  │
     │                │                │                │  criteria     │
     │                │                │                │                │
     │                │                │  8. Grade result               │
     │                │                │  { grade: "A",                  │
     │                │                │    score: 92,                  │
     │                │                │    priceSuggestion: ₹28/kg,   │
     │                │                │    defects: [],                │
     │                │                │    comparison: "Grade A fetches│
     │                │                │     20% more than Grade B" }  │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │  9. View grade, price suggestion, comparison     │                │
     │<───────────────────────────────│                │                │
```

### 10.5 Supply Chain Tracking Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Farmer / │     │ Frontend │     │ Backend  │     │ Database │
│  Buyer   │     │ (React)  │     │(Express) │     │(SQLite)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. Create listing / order      │                │
     │───────────────>│                │                │
     │                │  2. POST /supply-chain/init     │
     │                │───────────────>│                │
     │                │                │  3. Create     │
     │                │                │  tracking ID + │
     │                │                │  QR code       │
     │                │                │───────────────>│
     │                │                │                │
     │                │  4. Tracking ID + QR code       │
     │                │<───────────────│                │
     │  5. Display tracking page + QR  │                │
     │<───────────────│                │                │
     │                │                │                │
     │  STATUS UPDATES AT EACH STAGE: │                │
     │  ──────────────────────────────│                │
     │                │                │                │
     │  6. Farmer marks "Picked Up"    │                │
     │───────────────>│                │                │
     │                │  7. PUT /supply-chain/:id/status│
     │                │  { status: "PICKED_UP",         │
     │                │    location: {...}, timestamp } │
     │                │───────────────>│                │
     │                │                │  8. Update     │
     │                │                │───────────────>│
     │                │                │                │
     │  9. Transporter marks "In Transit"               │
     │───────────────>│                │                │
     │                │  10. Update status              │
     │                │───────────────>│                │
     │                │                │                │
     │  11. Mandi marks "Received"     │                │
     │───────────────>│                │                │
     │                │  12. Update status              │
     │                │───────────────>│                │
     │                │                │                │
     │  13. All parties view full      │                │
     │  timeline with timestamps      │                │
     │<───────────────────────────────│                │
```

### 10.6 Complete End-to-End Data Flow (Full Platform)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    KrishiMitra AI — COMPLETE DATA FLOW                         ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ┌──────────────────────────────────────────────────────────────────────────┐  ║
║  │                         FARMER JOURNEY                                   │  ║
║  │                                                                          │  ║
║  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │  ║
║  │  │  PLANT   │──>│  GROW    │──>│ HARVEST  │──>│   SELL   │            │  ║
║  │  │          │   │          │   │          │   │          │            │  ║
║  │  │ Soil     │   │ Weather  │   │ Quality  │   │ Mandi    │            │  ║
║  │  │ Analysis │   │ Monitor  │   │ Grading  │   │ Prices   │            │  ║
║  │  │          │   │          │   │          │   │          │            │  ║
║  │  │ Crop     │   │ Disease  │   │ Inventory│   │ Buyer    │            │  ║
║  │  │ Select   │   │ Diagnosis│   │ Mgmt     │   │ Connect  │            │  ║
║  │  │          │   │          │   │          │   │          │            │  ║
║  │  │ Fertilizer│  │ Digital  │   │ Supply   │   │ Logistics│            │  ║
║  │  │ Advice   │   │ Twin     │   │ Chain    │   │ Booking  │            │  ║
║  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘            │  ║
║  │                                                                        │  ║
║  │  Pillar 1 Features: ◄──────────────────►  Pillar 2 Features:           │  ║
║  │  Soil, Disease, Weather,             Inventory, Quality, Mandi,        │  ║
║  │  Digital Twin, Consensus,            Marketplace, Supply Chain,        │  ║
║  │  What-If, RAG, Field Map, Dealer     Processing, Logistics            │  ║
║  │                                                                        │  ║
║  └──────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║  ┌──────────────────────────────────────────────────────────────────────────┐  ║
║  │                      PLATFORM ECOSYSTEM                                  │  ║
║  │                                                                          │  ║
║  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  ║
║  │  │  FARMER  │  │  DEALER  │  │  BUYER   │  │  ADMIN   │               │  ║
║  │  │          │  │          │  │          │  │          │               │  ║
║  │  │ Dashboard│  │ Dashboard│  │Dashboard │  │Dashboard │               │  ║
║  │  │ Inventory│  │ Products │  │ Listings │  │ Analytics│               │  ║
║  │  │ Listings │  │ Chat     │  │ Orders   │  │ Users    │               │  ║
║  │  │ Orders   │  │ Response │  │ Tracking │  │ Reports  │               │  ║
║  │  │ AI Tools │  │          │  │ Chat     │  │          │               │  ║
║  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │  ║
║  │       │              │              │              │                     │  ║
║  │       └──────────────┴──────┬───────┴──────────────┘                     │  ║
║  │                             │                                            │  ║
║  │                    ┌────────▼────────┐                                   │  ║
║  │                    │   BACKEND API   │                                   │  ║
║  │                    │   (Express.js)  │                                   │  ║
║  │                    └────────┬────────┘                                   │  ║
║  │                             │                                            │  ║
║  │              ┌──────────────┼──────────────┐                             │  ║
║  │              │              │              │                             │  ║
║  │     ┌────────▼───┐  ┌──────▼──────┐  ┌───▼────────┐                    │  ║
║  │     │  Database   │  │ External   │  │ AI Models  │                    │  ║
║  │     │  (SQLite)   │  │ APIs       │  │ (LMM, RAG) │                    │  ║
║  │     │             │  │            │  │            │                    │  ║
║  │     │ Users       │  │ Weather    │  │ Disease    │                    │  ║
║  │     │ Inventory   │  │ Mandi/eNAM │  │ Detection  │                    │  ║
║  │     │ Listings    │  │ Nominatim  │  │ Soil       │                    │  ║
║  │     │ Orders      │  │ Amazon/FK  │  │ Analysis   │                    │  ║
║  │     │ Tracking    │  │ Gov APIs   │  │ Quality    │                    │  ║
║  │     │ Consensus   │  │            │  │ Grading    │                    │  ║
║  │     └─────────────┘  └────────────┘  └────────────┘                    │  ║
║  └──────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 11. Enhancements to Existing Features

| Existing Feature | Enhancement | Pillar Addressed |
|------------------|-------------|------------------|
| **Farmer Dashboard** | Add "My Inventory" widget showing stock levels, pending orders, and low-stock alerts | Pillar 2 |
| **Dealer Dashboard** | Expand to include buyer role — buyers can browse and place produce orders | Pillar 2 |
| **Post Crop Issue** | Add "Post Produce for Sale" tab alongside crop issue posting | Pillar 2 |
| **AI Assistant** | Add mandi price queries, storage tips, processing advice, and supply chain tracking responses | Pillar 2 |
| **What-If Simulator** | Add "Post-Harvest Loss" simulation module — model storage spoilage under different temperature/humidity conditions | Pillar 2 |
| **Digital Twin** | Extend to track stored produce condition — add cold storage sensor monitoring (temperature, humidity, ethylene levels) | Pillar 2 |
| **Weather Page** | Add "Harvest Window Advisory" — optimal days to harvest based on 5-day weather forecast | Both |
| **Products Page** | Add packaging materials, storage bags, cold storage equipment, and processing tools to marketplace | Pillar 2 |
| **Consensus Engine** | Add a 5th agent: "Supply Chain & Market Agent" — optimize selling timing, logistics, and buyer selection | Pillar 2 |
| **Field Mapping** | Add harvest zone overlay — mark which sections of the field have been harvested and their yield estimates | Pillar 2 |

---

## 12. Implementation Roadmap & Priority Matrix

### Priority Matrix

| Priority | Feature | Effort | Impact on Pillar 2 | SIH Score Boost |
|----------|---------|--------|---------------------|-----------------|
| 🔴 P0 | Post-Harvest Inventory (`/inventory`) | Medium | Very High | +15% |
| 🔴 P0 | Mandi Price Dashboard (`/mandi-prices`) | Medium | Very High | +15% |
| 🔴 P0 | Buyer-Seller Marketplace (`/marketplace`) | High | Very High | +15% |
| 🟡 P1 | AI Quality Grading (`/quality-grade`) | Medium | High | +10% |
| 🟡 P1 | Processing Unit Directory (`/processors`) | Low | High | +5% |
| 🟡 P1 | Supply Chain Tracker (`/supply-chain`) | High | High | +10% |
| 🟠 P2 | Logistics Booking (`/logistics`) | Medium | Medium | +5% |
| 🟠 P2 | Cooperative Management (`/cooperative`) | Medium | Medium | +5% |
| 🟠 P2 | Cold Chain Monitor (`/cold-storage`) | Medium | Medium | +5% |
| ⚪ P3 | FoodTech Integration (`/foodtech`) | Medium | Low | +3% |
| ⚪ P3 | Government Schemes (`/schemes`) | Low | Low | +2% |

### Recommended Implementation Order

#### Phase 1: Foundation (Week 1-2) — Address Pillar 2 Core
1. **Post-Harvest Inventory** — New page `/inventory` with CRUD operations
2. **Mandi Price Dashboard** — New page `/mandi-prices` with API integration
3. **Database schema extensions** — Add Inventory, Listings, Orders tables

#### Phase 2: Marketplace (Week 3-4) — Connect Buyers & Farmers
4. **Buyer-Seller Marketplace** — New page `/marketplace` with listing, search, order
5. **AI Quality Grading** — Extend camera + AI pipeline for produce assessment
6. **Farmer Dashboard enhancements** — Add inventory widget

#### Phase 3: Supply Chain (Week 5-6) — End-to-End Tracking
7. **Supply Chain Tracker** — QR codes, status updates, timeline view
8. **Processing Unit Directory** — New page `/processors` (reuses Dealer architecture)
9. **Logistics Booking** — Transport booking and tracking

#### Phase 4: Advanced Features (Week 7-8) — Differentiation
10. **Cooperative Management** — Group formation and collective selling
11. **Cold Chain Monitor** — IoT-simulated storage monitoring
12. **Enhanced AI capabilities** — Add Supply Chain agent to Consensus Engine

### Current Score vs Target Score

```
CURRENT STATE:
  Pillar 1: ████████████████████░░░░░░░░░░  85%
  Pillar 2: ██░░░░░░░░░░░░░░░░░░░░░░░░░░░  10%
  Overall:  ███████████░░░░░░░░░░░░░░░░░░░  55%

AFTER PHASE 1 (Inventory + Mandi Prices):
  Pillar 1: ████████████████████░░░░░░░░░░  85%
  Pillar 2: ████████░░░░░░░░░░░░░░░░░░░░░░  35%
  Overall:  ██████████████░░░░░░░░░░░░░░░░  65%

AFTER PHASE 2 (Marketplace + Quality Grading):
  Pillar 1: ████████████████████░░░░░░░░░░  85%
  Pillar 2: ██████████████░░░░░░░░░░░░░░░░  55%
  Overall:  ████████████████░░░░░░░░░░░░░░  75%

AFTER PHASE 3 (Supply Chain + Processing + Logistics):
  Pillar 1: ████████████████████░░░░░░░░░░  85%
  Pillar 2: ████████████████████░░░░░░░░░░  75%
  Overall:  ████████████████████░░░░░░░░░░  83%

AFTER PHASE 4 (All Features Complete):
  Pillar 1: █████████████████████████████░  95%
  Pillar 2: ████████████████████████░░░░░░  85%
  Overall:  ████████████████████████░░░░░░  92%
```

---

## 13. Final Alignment Score & Conclusion

### Current State
- **Pillar 1 Coverage:** 85% — Comprehensive farming intelligence platform
- **Pillar 2 Coverage:** 10% — Minimal post-harvest/processing features
- **Overall Alignment:** ~55%

### After Full Implementation
- **Pillar 1 Coverage:** 95% — Enhanced with harvest advisories and integrated inventory awareness
- **Pillar 2 Coverage:** 85% — Complete post-harvest management and processing ecosystem
- **Overall Alignment:** ~92%

### Key Strengths of Current Project
1. **Technical Sophistication** — 5 advanced AI engines (Digital Twin, Consensus, What-If, RAG, GIS) demonstrate deep technical capability
2. **User-Centric Design** — Multi-language support, voice interface, camera integration for low-literacy farmers
3. **Real-World Applicability** — Direct integration with Amazon, Flipkart, dealer networks, and government data
4. **Scalable Architecture** — Modular React frontend with Express.js backend and SQLite database

### Critical Gaps to Address
1. **No post-harvest produce management** — The problem statement explicitly requires "manage and process agriculture produce"
2. **No market price intelligence** — Farmers lack access to real-time mandi prices and price predictions
3. **No buyer-seller connection** — No mechanism for farmers to directly sell their harvested produce

### Recommendation
**Focus Phase 1 and Phase 2 immediately.** Adding the Post-Harvest Inventory, Mandi Price Dashboard, and Buyer-Seller Marketplace will transform this project from a farming-assistance tool into a **complete agricultural value chain platform** that fully addresses both pillars of SIH26193.

---

## Appendix A: File Structure Reference

### Current Frontend Pages
| Route | File | Purpose |
|-------|------|---------|
| `/` | `LandingPage.tsx` | Public landing page |
| `/dashboard` | `FarmerDashboard.tsx` | Farmer home dashboard |
| `/dealer-dashboard` | `DealerDashboard.tsx` | Dealer portal |
| `/analyze` | `AnalyzeCropPage.tsx` | Crop disease diagnosis |
| `/analysis/:id` | `AnalysisDetailPage.tsx` | Diagnosis results |
| `/history` | `CropHistoryPage.tsx` | Past diagnoses |
| `/soil-analysis` | `SoilAnalysisPage.tsx` | Soil health assessment |
| `/weather` | `WeatherPage.tsx` | Weather & advisories |
| `/products` | `ProductsPage.tsx` | Marketplace (buy inputs) |
| `/dealers` | `DealersPage.tsx` | Dealer directory |
| `/chat` | `ChatPage.tsx` | Real-time messaging |
| `/post-crop` | `PostCropPage.tsx` | Post crop issues |
| `/assistant` | `AIAssistantPage.tsx` | AI chat assistant |
| `/learn` | `LearnPage.tsx` | Learning resources |
| `/profile` | `FarmerProfilePage.tsx` | User profile |
| `/admin` | `AdminDashboard.tsx` | Admin panel |
| `/digital-twin` | `DigitalTwinPage.tsx` | Farm digital twin |
| `/consensus-engine` | `ConsensusEnginePage.tsx` | Multi-agent deliberation |
| `/what-if-simulation` | `WhatIfSimulationPage.tsx` | Climate simulator |
| `/agronomy-rag` | `AgronomyRAGPage.tsx` | RAG knowledge base |
| `/field-mapping` | `FieldMappingPage.tsx` | GIS field mapping |

### Proposed New Pages
| Route | File | Purpose |
|-------|------|---------|
| `/inventory` | `InventoryPage.tsx` | Post-harvest produce inventory |
| `/mandi-prices` | `MandiPricePage.tsx` | Real-time mandi price dashboard |
| `/marketplace` | `ProduceMarketplacePage.tsx` | Buyer-seller produce marketplace |
| `/quality-grade` | `QualityGradePage.tsx` | AI produce quality grading |
| `/supply-chain` | `SupplyChainPage.tsx` | End-to-end supply chain tracker |
| `/processors` | `ProcessorsPage.tsx` | Processing unit directory |
| `/logistics` | `LogisticsPage.tsx` | Transport booking |
| `/cooperative` | `CooperativePage.tsx` | Farmer cooperative management |
| `/cold-storage` | `ColdStoragePage.tsx` | Cold chain monitoring |

---

*Document prepared for Smart India Hackathon 2025-26 — Problem Statement SIH26193*
*KrishiMitra AI — Enhancing Agriculture and Managing India's Agricultural Produce*
