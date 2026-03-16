# Biztech - Architecture Documentation

## Overview

Biztech is a web application for Enterprise Architecture Management (EAM). It provides tools for managing application portfolios, technology stacks, system interfaces, dependencies, and performing impact analysis.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Biztech System                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Frontend (React)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│   │
│  │  │Dashboard │ │ CRUD     │ │ Graph    │ │ Impact Analysis ││   │
│  │  │ Page     │ │ Pages    │ │ Viz      │ │ Module          ││   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│   │
│  │           │          │           │              │            │   │
│  │           └──────────┴───────────┴──────────────┘            │   │
│  │                          │                                   │   │
│  │                    API Service (Axios)                       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │ HTTP/REST                            │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │                     Backend (Node.js)                        │   │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────┐  │   │
│  │  │ Routes  │──│ Services │──│ Database  │──│ PostgreSQL  │  │   │
│  │  │         │  │          │  │ Config    │  │             │  │   │
│  │  └─────────┘  └──────────┘  └───────────┘  └─────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │ Middleware: Auth (JWT) | Error Handler | Validation    ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI Framework |
| TypeScript | 5.3 | Type-safe JavaScript |
| Vite | 5.0 | Build tool & dev server |
| Material UI | 5.14 | Component library |
| Cytoscape.js | 3.26 | Graph visualization |
| Recharts | 2.10 | Charts and analytics |
| Zustand | 4.4 | State management |
| Axios | 1.6 | HTTP client |
| React Router | 6.20 | Client-side routing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18 | Web framework |
| TypeScript | 5.3 | Type-safe JavaScript |
| PostgreSQL | 14+ | Database |
| pg (node-postgres) | 8.11 | Database client |
| jsonwebtoken | 9.0 | JWT authentication |
| bcryptjs | 2.4 | Password hashing |
| Winston | 3.11 | Logging |
| Helmet | 7.1 | Security headers |
| express-validator | 7.0 | Input validation |

## Project Structure

```
airam/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts       # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authentication
│   │   │   └── errorHandler.ts   # Global error handling
│   │   ├── routes/
│   │   │   ├── application.routes.ts
│   │   │   ├── technology.routes.ts
│   │   │   ├── interface.routes.ts
│   │   │   ├── dependency.routes.ts
│   │   │   ├── person.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── impact.routes.ts
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   ├── application.service.ts
│   │   │   ├── technology.service.ts
│   │   │   ├── interface.service.ts
│   │   │   ├── dependency.service.ts
│   │   │   ├── person.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── impact.service.ts
│   │   │   └── auth.service.ts
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── logger.ts         # Winston logger config
│   │   └── index.ts              # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx        # App layout with navigation
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Applications.tsx
│   │   │   ├── ApplicationDetail.tsx
│   │   │   ├── Technologies.tsx
│   │   │   ├── Interfaces.tsx
│   │   │   ├── Persons.tsx
│   │   │   ├── Dependencies.tsx
│   │   │   ├── ArchitectureMap.tsx
│   │   │   └── ImpactAnalysis.tsx
│   │   ├── services/
│   │   │   └── api.ts            # Axios configuration
│   │   ├── stores/
│   │   │   └── authStore.ts      # Zustand auth store
│   │   ├── types/
│   │   │   └── index.ts          # Frontend TypeScript types
│   │   ├── theme.ts              # MUI theme configuration
│   │   ├── App.tsx               # Root component with routing
│   │   └── main.tsx              # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── database/
│   ├── schema.sql                # Database schema
│   └── seed.sql                  # Sample data
│
├── docs/
│   ├── api.md                    # API documentation
│   └── architecture.md           # This file
│
└── README.md
```

## Data Model

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   applications   │       │   technologies   │       │     persons      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ name             │       │ name             │       │ name             │
│ description      │       │ version          │       │ email            │
│ type             │       │ category         │       │ role             │
│ version          │       │ vendor           │       │ department       │
│ status           │       │ status           │       │ phone            │
│ criticality      │       │ end_of_support   │       └────────┬─────────┘
│ owner            │       └────────┬─────────┘                │
│ documentation_url│                │                          │
└────────┬─────────┘                │                          │
         │                          │                          │
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        application_technologies                       │
│ ┌───────────────────┐  ┌───────────────────┐                         │
│ │ application_id(FK)│  │ technology_id(FK) │                         │
│ └───────────────────┘  └───────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          application_persons                          │
│ ┌───────────────────┐  ┌───────────────────┐                         │
│ │ application_id(FK)│  │ person_id(FK)     │                         │
│ └───────────────────┘  └───────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                    ┌──────────────────┐
│   dependencies   │                    │   interfaces     │
├──────────────────┤                    ├──────────────────┤
│ id (PK)          │                    │ id (PK)          │
│ source_id (FK)───┼───► applications   │ name             │
│ target_id (FK)───┼───► applications   │ source_id (FK)───┼───► applications
│ type             │                    │ target_id (FK)───┼───► applications
│ description      │                    │ type             │
└──────────────────┘                    │ protocol         │
                                        │ data_format      │
                                        │ frequency        │
                                        │ description      │
                                        └──────────────────┘
```

### Enum Types

| Enum | Values |
|------|--------|
| ApplicationType | CRM, ERP, API, BACKEND, SAAS, MICROSERVICE, DATABASE, MIDDLEWARE, FRONTEND, MOBILE, OTHER |
| LifecycleStatus | PLANNING, DEVELOPMENT, TESTING, PRODUCTION, DEPRECATED, RETIRED |
| BusinessCriticality | CRITICAL, HIGH, MEDIUM, LOW |
| TechnologyStatus | EMERGING, CURRENT, RETIRING, OBSOLETE |
| IntegrationType | REST, SOAP, GRAPHQL, GRPC, MESSAGE_QUEUE, FILE_TRANSFER, DATABASE_LINK, ETL, OTHER |
| PersonRole | OWNER, ARCHITECT, DEVELOPER, ADMIN, STAKEHOLDER |
| DependencyType | RUNTIME, DATA, INFRASTRUCTURE, SERVICE |

## Authentication Flow

```
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│  Client  │                  │  Server  │                  │ Database │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                             │                             │
     │ POST /auth/login            │                             │
     │ {email, password}           │                             │
     ├────────────────────────────►│                             │
     │                             │ SELECT user                 │
     │                             ├────────────────────────────►│
     │                             │                             │
     │                             │◄────────────────────────────┤
     │                             │ Verify password (bcrypt)    │
     │                             │                             │
     │  {accessToken, refreshToken}│                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │ GET /api/applications       │                             │
     │ Authorization: Bearer token │                             │
     ├────────────────────────────►│                             │
     │                             │ Verify JWT                  │
     │                             │ Query applications          │
     │                             ├────────────────────────────►│
     │                             │                             │
     │  {applications}             │◄────────────────────────────┤
     │◄────────────────────────────┤                             │
     │                             │                             │
```

### Token Refresh

- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Client automatically requests new access token using refresh token
- On 401 response, frontend interceptor attempts token refresh

## Graph Visualization

### Architecture Map

The Architecture Map page displays an interactive graph visualization using Cytoscape.js:

- **Nodes**: Applications (colored by type, sized by criticality)
- **Edges**: Dependencies (dashed) and Interfaces (solid)
- **Layout**: Force-directed (CoSE) for automatic positioning
- **Interactions**: Pan, zoom, node selection, edge filtering

### Impact Analysis

The Impact Analysis page shows the dependency chain when an application changes:

- **Root Node**: Selected application (highlighted)
- **Direct Dependencies**: Applications directly dependent on the root
- **Indirect Dependencies**: Applications dependent on direct dependencies
- **Layout**: Breadth-first tree from root node

## Security Considerations

1. **Authentication**: JWT-based with access/refresh token pattern
2. **Password Storage**: bcrypt hashing with salt rounds
3. **HTTP Headers**: Helmet middleware for security headers
4. **CORS**: Configured for specific origins
5. **Input Validation**: express-validator on all endpoints
6. **SQL Injection**: Parameterized queries via node-postgres

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure database connection in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
psql -U postgres -d biztech -f database/schema.sql
psql -U postgres -d biztech -f database/seed.sql
```

## Deployment Considerations

### Production Environment
- Use process manager (PM2) for Node.js
- Configure reverse proxy (nginx)
- Enable HTTPS with SSL certificates
- Set secure environment variables
- Configure proper CORS origins
- Enable database connection pooling
- Set up log aggregation

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 3001 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_REFRESH_SECRET | Secret for refresh tokens | - |
| CORS_ORIGIN | Allowed CORS origins | http://localhost:5173 |
| NODE_ENV | Environment (development/production) | development |

## Future Enhancements

- [ ] Role-based access control (RBAC)
- [ ] Audit logging
- [ ] Technology lifecycle management
- [ ] Cost allocation tracking
- [ ] Integration with CMDB systems
- [ ] Export to common EA formats (ArchiMate, TOGAF)
- [ ] Real-time collaboration
- [ ] API rate limiting
- [ ] GraphQL API option
- [ ] Docker containerization
