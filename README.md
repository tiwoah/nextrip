# NexTrip

<p align="center">
  AI-powered travel planning — from prompt to complete itinerary
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-black" />
  <img src="https://img.shields.io/badge/Status-Completed-blue" />
  <img src="https://img.shields.io/badge/Frontend-Leaflet-blue" />
  <img src="https://img.shields.io/badge/APIs-Ticketmaster%20%7C%20AviationStack%20%7C%20Hotel-orange" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" />
</p>

---

## Overview
NexTrip is an AI-driven travel planner that transforms a single user prompt into a complete, structured itinerary. It consolidates flights, hotels, events, and activities into one seamless experience, eliminating the need to navigate multiple platforms.

---

## Key Highlights
- Generates full travel plans in seconds  
- Integrates multiple real-world APIs into a unified workflow  
- Clean, minimal interface centered on a single input  
- End-to-end experience: discovery → planning → booking  

---

## Problem
Travel planning is fragmented and inefficient. Users must:
- Search flights, hotels, and events across different platforms  
- Compare options manually  
- Organize everything into a coherent schedule  

---

## Solution
NexTrip introduces a prompt-based interface where users describe their trip in natural language, and the system generates a complete, structured itinerary with actionable results.

---

## Features
- **AI-Powered Itinerary Generation**  
  Converts natural language into structured travel plans  

- **Conversational Refinement**  
  Collects missing details through intelligent follow-up questions  

- **Comprehensive Travel Coverage**  
  - Flights  
  - Hotels  
  - Events & concerts  
  - Activities & locations  

- **Daily Itinerary**  
  Clear, day-by-day schedule  

- **Budget Breakdown**  
  Transparent cost distribution  

- **Interactive Map**  
  Visualized with Leaflet  

- **Direct Booking Links**  
  Seamless transition to external booking  

- **Journey Management**  
  Save, edit, and regenerate trips  

---

## System Flow
1. User submits a prompt  
2. AI interprets intent  
3. Orchestrator determines required data  
4. External APIs are queried  
5. Data is normalized and merged  
6. AI generates structured itinerary  
7. UI renders results  

---

## Tech Stack

### Core
- AI Model (prompt interpretation and orchestration)

### Integrations
- **Ticketmaster API** – events & entertainment  
- **AviationStack API** – flight data  
- **Hotel API** – accommodations  

### Frontend
- **Leaflet** – interactive mapping  

---

## Demo

<p align="center">
  <img src="img/genAIpic.png" width="750"/>
</p>

<p align="center">
  <img src="img/original (1).png" width="750"/>
</p>

<p align="center">
  <img src="img/original.png" width="750"/>
</p>

---

## Challenges & Engineering Decisions

### Multi-API Orchestration
Normalized inconsistent API responses into a unified data model to enable reliable itinerary generation.

### UI Simplicity vs Data Density
Designed a minimal interface that presents complex travel data in a clear, structured format.

### AI Interaction Design
Balanced follow-up questioning to ensure accuracy without slowing the user experience.

---

## Impact
- Reduced travel planning time from hours to seconds  
- Unified fragmented travel services into one platform  
- Demonstrated practical AI orchestration with real-world APIs  

---

## Future Roadmap
- Real-time pricing and availability  
- Personalized recommendations  
- Budget optimization  
- Collaborative trip planning  
- In-platform booking  

---

## Getting Started

```bash
git clone https://github.com/tiwoah/nextrip.git
cd nextrip
npm install
npm run dev