# ?? AgriNexus — Smart Agriculture Platform

**Live Demo:** [https://krishimi.freebuff.app](https://krishimi.freebuff.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-slate.svg)](https://expressjs.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS-green.svg)](https://leafletjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-indigo.svg)](https://www.prisma.io/)

> **AgriNexus** is a production-grade, AI-powered agricultural intelligence platform designed for farmers **across India**. It combines real-device computer vision disease diagnosis, real-time GPS pinpoint weather forecasting, direct marketplace purchasing (Amazon & Flipkart), verified agro-dealer communications, and 5 cutting-edge agricultural AI engines.

---

## ?? Key Platform Features

### 1. ?? Real Device Camera Crop Diagnosis (`/analyze`)
* Real-time webcam and mobile camera integration via `navigator.mediaDevices.getUserMedia()`.
* Front/back camera toggle, centered viewfinder leaf overlay, snapshot preview, retake, and confirmation.
* AI Plant Doctor diagnoses with disease identification, severity ratings, symptoms, organic and chemical remedies, and Web Speech audio playback.

### 2. ?? Pinpoint City Geolocation & 5-Day Weather (`/weather`)
* Real-time GPS auto-detection via `navigator.geolocation` with Nominatim reverse geocoding to resolve exact City, District, and State.
* Live temperature, relative humidity, wind speed, rainfall probability, and a 5-day agricultural weather forecast with farming advisories.

### 3. ?? Agricultural Marketplace with Direct Links (`/products`)
* Recommended fertilizers, bio-fungicides, and tools with real price tags in Indian Rupees (?).
* **"Amazon"** (Amber) and **"Flipkart"** (Blue) direct buttons opening store search and product pages in new tabs.

### 4. ?? Verified Agro Dealers & Direct Communication (`/dealers`)
* Verified dealer directory across India with state-wise filtering and direct communication options.
* Direct phone call button (`tel:`), direct WhatsApp messaging (`https://wa.me/`), and in-app real-time messaging powered by Socket.IO.

### 5. ??? Multi-Language Voice Assistant (`/assistant`)
* Full regional language translations for **Odia (?????)**, **Hindi (??????)**, **Bengali (?????)**, **Telugu (??????)**, **Tamil (?????)**, **Kannada (?????)**, **Marathi (?????)**, and **English**.
* Web Speech API microphone input and text-to-speech audio readouts for farmers with limited literacy.

---

## ?? 5 Advanced Agricultural Intelligence Engines

### 1. ?? Digital Twin Engine (`/digital-twin`)
* Dynamic temporal JSON state of the farm (soil pH 6.4, 0-5cm topsoil moisture %, 10-30cm root-zone moisture %, NPK mg/kg, biomass NDVI, canopy temp, vapor pressure deficit).
* Interactive vertical soil depth horizon viewer (0-5cm Topsoil, 5-15cm Root Zone, 15-30cm Subsoil).
* Live IoT sensor telemetry pulse simulation with real-time graph updates over WebSockets.

### 2. ?? Multi-Agent Consensus System (`/consensus-engine`)
* LangGraph / CrewAI style autonomous agent deliberation theater:
  * ?? **Agronomy & Crop Health Agent**: Yield maximization and leaf area expansion.
  * ??? **Meteorology & Climate Risk Agent**: Radar thunderstorm and runoff risk mitigation.
  * ?? **Hydrology & Irrigation Agent**: Groundwater conservation and Alternate Wetting and Drying (AWD).
  * ?? **Agro-Economics & Farmer Budget Agent**: Smallholder input cost minimization.
  * ?? **Consensus Arbiter**: Synthesizes conflicting debates into a Unified Step-by-Step Action Plan with consensus scoring (0-100%).

### 3. ?? Interactive "What-If" Predictive Crop Simulator (`/what-if-simulation`)
* Climate perturbation sandbox with interactive sliders (-3?C to +6?C heatwave, 0 to 25 days drought, flood inundation, irrigation supply, pest outbreak).
* Biophysical modeling projecting 14-day soil moisture decay against the critical 18% wilting threshold, NDVI stress trajectories, and yield/profit impact.

### 4. ?? Agronomy RAG Knowledge Base & Guardrails (`/agronomy-rag`)
* Vector knowledge store grounded in verified research manuals from **ICAR** and **FAO**.
* Automated safety guardrails enforcing chemical dosage upper-bounds and blocking banned agrochemicals (CIBRC compliance).

### 5. ??? Interactive GIS Field Mapping (`/field-mapping`)
* Leaflet geospatial map to draw field boundary polygon vertices and calculate acreage (Acres, Hectares, Guntha), perimeter, and centroid GPS coordinates.
* Simulated satellite spectral overlays: **NDVI Biomass Spectrum**, **Soil Moisture Band**, and **Disease Risk Zones**.
* One-click plot synchronization to the farmer's Digital Twin.

---

## ??? Architecture & Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons, Socket.IO Client, Axios.
* **Backend**: Express.js, Node.js, TypeScript, Socket.IO, Prisma ORM, SQLite, Multer.
* **APIs & Services**: Nominatim Reverse Geocoding, Web Speech Recognition & Synthesis, MediaDevices Camera API.

---

## ?? Quick Start & Local Setup

### Prerequisites
* **Node.js**: v18 or higher
* **npm**: v9 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/TejPrakash-Vashishtha/AgriNexus.git
cd AgriNexus
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run setup   # Generates Prisma client, runs DB migrations & seeds demo data
npm run dev     # Starts Express & Socket.IO server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev     # Starts Vite dev server on http://localhost:5173
```

### 4. Access the Application
Visit the live deployment at **[https://krishimi.freebuff.app](https://krishimi.freebuff.app)** or run locally:

---

## ?? License
Distributed under the MIT License. Developed for the farmers of India.
