# Consumer Intelligence Platform

A unified multi-brand D2C platform designed to aggregate consumer behavior across different brands and provide actionable intelligence through segmentation and propensity scoring.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: Angular 17+ (Standalone Components, HttpClient)
- **Database**: MongoDB (Local or Atlas)

## Core Features
1. **Unified User Profile**: A single identity for users across multiple brand interactions.
2. **Dynamic Segmentation Engine**:
   - **High Value User**: Based on total spend threshold.
   - **Cross-Brand User**: Active across multiple brands.
   - **Dormant User**: Inactive beyond a configurable period.
   - **Lifecycle Transition Candidate**: Engagement signals without purchases in new brands.
3. **Propensity Scoring**: 0–100 score estimating purchase likelihood based on recency, frequency, and engagement, with explainable rationale.
4. **Behavioral Tracking**: Timestamped events (Purchases, Activity, Engagement) linked to User and Brand.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally at `mongodb://localhost:27017`

### Backend Setup
1. Navigate to `backend/` folder.
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`
   - Server runs at `http://localhost:5000`
   - Database will be automatically connected.

### Database Seeding
To populate the system with realistic dummy data:
```bash
# In the backend directory
curl -X POST http://localhost:5000/api/seed
```
This will create 5 brands, 10 users, and multiple events/associations.

### Frontend Setup
1. Navigate to `frontend/` folder.
2. Install dependencies: `npm install`
3. Start the application: `npm start`
4. Open your browser at `http://localhost:4200`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Global stats and distributions |
| GET | `/api/users` | List all unified consumer profiles |
| GET | `/api/users/:id` | Detailed profile with intelligence |
| POST | `/api/users` | Create/Update consumer (Upsert) |
| POST | `/api/events` | Log behavioral/transactional event |
| POST | `/api/seed` | Reset and seed database |

## Project Structure
- `/backend`: Express application, models, services (Segmentation/Scoring), and seed scripts.
- `/frontend`: Angular application with services and components for Dashboard, User List, and User Details.
