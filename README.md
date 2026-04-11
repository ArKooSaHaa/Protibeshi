
# Protibeshi – AI-Powered Hyper-Local Community Platform

## Project Overview

Protibeshi is a smart, AI-enhanced hyper-local community platform designed to strengthen neighborhood communication, improve safety, and provide trusted local information.
The platform combines location-restricted social interaction, verified community services, and AI-driven assistance to solve real-world problems faced by urban and semi-urban residents.


## Objective

Protibeshi aims to eliminate the gap in trusted, neighborhood-level digital communication by providing a secure, intelligent, and location-aware platform where users can:

* Stay informed about local events and emergencies
* Communicate only with verified neighbors
* Access AI-generated insights and alerts
* Buy, sell, rent, and find services safely
* Get instant AI help for urgent or daily needs


## Target Audience

* Residents of urban and semi-urban neighborhoods
* Apartment and housing communities
* Local service providers
* Area administrators and community leaders



## Technology Stack

### Backend

* Laravel (PHP Framework)
* RESTful API
* Laravel Sanctum for authentication
* Role-based access control

### Frontend

* React.js
* Tailwind CSS
* Axios for API communication

### Rendering Method

* Client-Side Rendering (CSR)

## UI Design

Figma Design Link:
https://www.figma.com/make/7LT5OS1Q5JLhysiOv8YFaj/Enhance-Protibeshi-Features?fullscreen=1&t=euv09oris19hKT0K-1

### Core UI Screens

* Login and registration with verification
* Area selection and location confirmation
* Location-restricted home feed
* Emergency alert interface
* Buy, sell, and rent listings
* Messaging and chat interface
* Service provider profiles
* Admin dashboard



## Core Features

### Authentication and Authorization

* Secure login using Laravel Sanctum
* Role-based access: User and Admin
* Area-based content visibility

### Community Features

* Area-restricted posts and notices
* Neighbor-to-neighbor messaging
* Community announcements with admin approval
* Complaint and issue reporting system



## AI-Powered Features

### AI News and Notice Summarization

* Automatically summarizes long local notices and updates
* Presents information in short and easy-to-read points

### AI Price Comparison

* Compares prices of local products and services
* Helps users find the best options within nearby areas

### Local Trend Analysis

* Identifies trending topics within a neighborhood
* Highlights common issues such as traffic, flooding, or shortages

### Smart Flood and Emergency Alerts

Users can ask:
“Is there any flood alert today?”

AI provides localized risk information and community-based updates.



### AI-Assisted Local Search

Users can ask:
“Find sublets near me”

AI filters results based on:

* Location
* Budget
* Availability
* Verification status

---

### Emergency AI Assistant

Users can ask:
“How to ask for emergency help?”

AI can:

* Guide users step-by-step
* Automatically create emergency posts
* Notify nearby users and administrators
* Suggest local emergency resources


## CRUD Functionalities

| Module       | Operations                      |
| ------------ | ------------------------------- |
| Posts        | Create, Read, Update, Delete    |
| Notices      | Create, Approve, Update, Delete |
| Buy/Sell     | Create, Read, Update, Delete    |
| Rent/Sublets | Create, Search, Update, Delete  |
| Services     | Create, Verify, Update, Delete  |
| Complaints   | Create, Track Status, Resolve   |



## Project Milestones

### Milestone 1 – Core Foundation

* User authentication and role management
* Location selection and area-based feed
* Basic UI implementation

Database:

* MySQL / MSSQL relational database
* Core tables: Users, Roles, Areas, Posts
* Primary–foreign key relationships
* Laravel migrations



### Milestone 2 – Community Modules

* Feed page post, like, comment
* Buy, sell, and rent modules
* Messaging system
* Service provider listings


### Milestone 3 – AI and Trust Features

* AI chatbot integration
* Emergency alert automation
* Local trend analysis
* Admin dashboards
* Performance and security optimization



## Conclusion

Protibeshi is an AI-assisted hyper-local community platform focused on trust, safety, and usability.
By combining modern UI design, secure neighborhood-based interaction, and intelligent AI features, Protibeshi creates a reliable digital environment for local communities.

## Docker Deployment

The repository includes a production-ready container stack in `docker-compose.prod.yml`.

### 1) Prepare environment

Copy the deployment environment template and set values for your server/domain:

```bash
cp .env.docker.example .env.docker
```

Important values to set in `.env.docker`:

- `APP_URL`
- `FRONTEND_URL`
- `VITE_API_URL` (public backend base URL used at frontend build time)
- `VITE_WS_HOST`
- `VITE_WS_PORT`
- `TLS_CERTS_PATH` (folder containing `fullchain.pem` and `privkey.pem`)
- `TLS_ACME_PATH` (optional ACME challenge folder)
- DB credentials (`MYSQL_*`, `DB_*`)

### HTTPS certificate mount points

Create local mount directories before first run:

```bash
mkdir -p nginx/certs nginx/acme-challenge
```

Place certificates in the path configured by `TLS_CERTS_PATH`:

- `fullchain.pem`
- `privkey.pem`

Nginx in production compose is configured to:

- Redirect HTTP (80) to HTTPS (443)
- Serve TLS traffic on 443
- Proxy `/api` to backend
- Proxy websocket paths (`/app`, `/apps`, `/laravel-websockets`) over TLS

### 2) Build and start all services

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d --build
```

This starts fully dockerized services:

- MySQL
- Laravel API backend
- Laravel queue worker
- Laravel websocket server
- Nginx (serves built frontend + reverse proxies `/api` and websocket paths)

### 3) Check service status and logs

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml ps
docker compose --env-file .env.docker -f docker-compose.prod.yml logs -f
```

### 4) Stop the deployment stack

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml down
```

## Free Deployment (Vercel + Railway)

If you deploy frontend on Vercel and backend on Railway, use the configs already included in this repo:

- Frontend: `client/vercel.json`
- Backend: `server/railway.json`, `server/start.railway.sh`

### Frontend on Vercel (from `client/`)

1. Import repository to Vercel.
2. Set Root Directory to `client`.
3. Set environment variables:
	- `VITE_API_URL=https://<your-backend>.up.railway.app`
	- `VITE_WS_HOST=<your-websocket-host>`
	- `VITE_WS_PORT=443`
	- `VITE_WSS_PORT=443`
	- `VITE_WS_SCHEME=wss`
4. Deploy.

### Backend on Railway (from `server/`)

1. Create a Railway service from this repo with Root Directory `server`.
2. Attach/create MySQL in Railway (or use external DB) and set DB env vars.
3. Set backend env vars (see `server/.env.railway.example`), especially:
	- `APP_URL`
	- `FRONTEND_URL`
	- `CORS_ALLOWED_ORIGINS` (your Vercel URL)
	- `DB_*`
	- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (default admin sign-in)
	- `RUN_ADMIN_SEEDER=true` (auto-seed default admin on startup)
	- `APP_KEY` and `JWT_SECRET` (or allow startup script to generate them)
4. Deploy.

### Important note about realtime/websocket

For realtime features, run websocket on a separate Railway service (same codebase, start command `php artisan websockets:serve --host=0.0.0.0 --port=$PORT`) and point frontend/backend websocket env values to that domain.
