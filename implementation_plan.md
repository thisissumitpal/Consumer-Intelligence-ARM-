# Consumer Intelligence Platform Implementation Plan

This document outlines the architecture, data models, APIs, and frontend structure for the multi-brand D2C Consumer Intelligence Platform.

## Goal
Build a unified consumer intelligence platform with a backend (Node.js, Express, MongoDB) and a frontend (Angular) that manages user profiles across multiple brands, tracks their behavior, calculates user segments, and computes a spending propensity score.

## User Review Required

> [!IMPORTANT]
> Please review the proposed **Database Schema**, **Segmentation Rules**, and **Propensity Scoring Logic** below. Let me know if these align with your expectations or if you need any adjustments before I start implementing the code.

## Open Questions

> [!NOTE]
> 1. Do you have a preference for Angular Material or Tailwind CSS for the frontend UI? (I will use modern styling as requested, potentially combining vanilla CSS and modern layout techniques if no preference).
> 2. What specific attributes should be stored under `demographics` and `lifecycle_stage` by default? I will use a reasonable set (age, location, gender).

## Proposed Architecture

- **Backend**: Node.js with Express.js, MongoDB using Mongoose ORM.
- **Frontend**: Angular 17/18.
- **Database**: MongoDB (Local or Atlas, the code will support a URI).

## Database Schema (MongoDB / Mongoose)

1.  **User Model**
    *   `email`: String, Unique (Used for unified identity/duplicate handling).
    *   `name`: String.
    *   `demographics`: Object (age, location, gender).
    *   `lifecycle_stage`: String (e.g., 'NEW', 'ACTIVE', 'CHURNED').
    *   `createdAt`, `updatedAt`: Timestamps.

2.  **Brand Model**
    *   `name`: String, Unique.
    *   `category`: String.

3.  **UserBrandRegistration Model** (Associates a user with a brand)
    *   `user`: ObjectId (Ref: User).
    *   `brand`: ObjectId (Ref: Brand).
    *   `acquisition_source`: String (e.g., 'Organic', 'Facebook Ads').
    *   `registered_at`: Date.
    *   *Compound Unique Index on `(user, brand)`*.

4.  **Event Model** (Behavioural & Transaction Data)
    *   `user`: ObjectId (Ref: User).
    *   `brand`: ObjectId (Ref: Brand).
    *   `event_type`: Enum ('PURCHASE', 'APP_ACTIVITY', 'CONTENT_ENGAGEMENT', 'OTHER').
    *   `timestamp`: Date.
    *   `value`: Number (Optional, e.g., purchase amount).
    *   `metadata`: Object (For flexibility, e.g., product IDs, content URLs).

## Core Logic & Engines

### 1. Consumer Segmentation Engine
A rule-based service that evaluates a user dynamically or periodically.
*   **High Value User**: Total sum of `value` in 'PURCHASE' events > configurable threshold (e.g., $500).
*   **Cross-Brand User**: Count of distinct `Brand` references in `UserBrandRegistration` or `Event` > 1.
*   **Dormant User**: No `Event` recorded in the last X days (e.g., 30 days).
*   **Lifecycle Transition Candidate**: Engagement exists across multiple brands but purchase frequency is dropping, OR active in one brand but recent registration in another without purchases yet.

### 2. Spending Propensity Scoring (0-100)
Calculated based on:
*   **Recency**: Higher points if the last event was very recent.
*   **Frequency**: Points based on the number of events per month.
*   **Engagement**: Bonus points for non-purchase engagement events (APP_ACTIVITY) prior to purchases.
*   **Rationale Generation**: Based on the dominant signals contributing to the score, a readable string will be generated (e.g., "Highly active recently but no purchases yet" -> Score: 40).

## Backend APIs

*   `POST /api/users` - Create or update a unified user profile.
*   `GET /api/users/:id` - Fetch user profile along with all brand associations, computed segments, and propensity score.
*   `POST /api/users/:id/register-brand` - Register a user to a specific brand.
*   `POST /api/events` - Log a new behavioral or transactional event.
*   `GET /api/users/:id/intelligence` - Returns only the segmentation and propensity scoring for the user.
*   `POST /api/seed` - Generates dummy data (Brands, Users, Events) for testing.

## Frontend (Angular)

*   **Dashboard View**: Overview of total users, brands, and events.
*   **User List View**: Table of unified users.
*   **User Detail View**: Shows:
    *   Basic profile & demographics.
    *   Registered brands.
    *   Timeline of events.
    *   **Intelligence Panel**: Displays the assigned Segments and the Propensity Score with its rationale.

## Verification Plan

1.  **Backend Implementation**: Start the Node server, run the seed script.
2.  **API Verification**: Use curl/REST client to test user creation (verifying deduplication), event logging, and ensure the `/intelligence` endpoint returns correct dynamic segments and scores based on the seed data.
3.  **Frontend Implementation**: Start Angular server, verify it fetches and visually displays the data effectively, providing a unified view of the customer.
