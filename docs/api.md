# Biztech API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "admin@biztech.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@biztech.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Applications

### GET /applications

Get paginated list of applications.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| type | string | - | Filter by application type |
| status | string | - | Filter by lifecycle status |
| criticality | string | - | Filter by business criticality |
| search | string | - | Search in name and description |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "SAP ERP",
      "description": "Enterprise Resource Planning system",
      "type": "ERP",
      "version": "S/4HANA 2023",
      "status": "PRODUCTION",
      "criticality": "CRITICAL",
      "owner": "IT Enterprise",
      "documentation_url": "https://wiki.company.com/sap",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 18,
    "totalPages": 2
  }
}
```

### GET /applications/:id

Get application details by ID.

### POST /applications

Create a new application.

**Request Body:**
```json
{
  "name": "New Application",
  "description": "Application description",
  "type": "BACKEND",
  "version": "1.0.0",
  "status": "DEVELOPMENT",
  "criticality": "MEDIUM",
  "owner": "Development Team",
  "documentation_url": "https://docs.example.com"
}
```

### PUT /applications/:id

Update an existing application.

### DELETE /applications/:id

Delete an application.

### GET /applications/:id/dependencies

Get all dependencies for an application.

### GET /applications/:id/interfaces

Get all interfaces for an application.

---

## Technologies

### GET /technologies

Get paginated list of technologies.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| category | string | - | Filter by category |
| status | string | - | Filter by status |
| search | string | - | Search in name |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "React",
      "version": "18.2",
      "category": "Frontend Framework",
      "vendor": "Meta/Facebook",
      "status": "CURRENT",
      "end_of_support": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /technologies/:id

Get technology details by ID.

### POST /technologies

Create a new technology.

### PUT /technologies/:id

Update an existing technology.

### DELETE /technologies/:id

Delete a technology.

### GET /technologies/:id/applications

Get applications using this technology.

---

## Interfaces

### GET /interfaces

Get paginated list of system interfaces.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| type | string | - | Filter by integration type |
| search | string | - | Search in name |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "CRM to ERP Customer Sync",
      "source_id": "uuid",
      "source_name": "Salesforce CRM",
      "target_id": "uuid",
      "target_name": "SAP ERP",
      "type": "REST",
      "protocol": "HTTPS",
      "data_format": "JSON",
      "frequency": "Real-time",
      "description": "Synchronizes customer data from CRM to ERP"
    }
  ],
  "pagination": { ... }
}
```

### GET /interfaces/:id

Get interface details by ID.

### POST /interfaces

Create a new interface.

**Request Body:**
```json
{
  "name": "New Interface",
  "source_id": "uuid",
  "target_id": "uuid",
  "type": "REST",
  "protocol": "HTTPS",
  "data_format": "JSON",
  "frequency": "Daily",
  "description": "Interface description"
}
```

### PUT /interfaces/:id

Update an existing interface.

### DELETE /interfaces/:id

Delete an interface.

---

## Dependencies

### GET /dependencies

Get paginated list of dependencies.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| type | string | - | Filter by dependency type |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "source_id": "uuid",
      "source_name": "Web Portal",
      "target_id": "uuid",
      "target_name": "Customer API",
      "type": "RUNTIME",
      "description": "Portal depends on Customer API for user data"
    }
  ],
  "pagination": { ... }
}
```

### POST /dependencies

Create a new dependency.

### PUT /dependencies/:id

Update an existing dependency.

### DELETE /dependencies/:id

Delete a dependency.

---

## Persons

### GET /persons

Get paginated list of responsible persons.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| role | string | - | Filter by role |
| search | string | - | Search in name or email |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "role": "ARCHITECT",
      "department": "IT Architecture",
      "phone": "+1-555-0100"
    }
  ],
  "pagination": { ... }
}
```

### GET /persons/:id

Get person details by ID.

### POST /persons

Create a new person.

### PUT /persons/:id

Update an existing person.

### DELETE /persons/:id

Delete a person.

### GET /persons/:id/applications

Get applications assigned to this person.

---

## Dashboard

### GET /dashboard/stats

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalApplications": 18,
    "totalTechnologies": 24,
    "totalInterfaces": 10,
    "totalDependencies": 15,
    "applicationsByType": {
      "ERP": 2,
      "CRM": 2,
      "API": 5,
      "BACKEND": 4,
      "MICROSERVICE": 3,
      "FRONTEND": 2
    },
    "applicationsByStatus": {
      "PRODUCTION": 12,
      "DEVELOPMENT": 4,
      "DEPRECATED": 2
    },
    "technologiesByStatus": {
      "CURRENT": 15,
      "RETIRING": 5,
      "OBSOLETE": 4
    },
    "criticalApplications": 5,
    "obsoleteTechnologies": 4
  }
}
```

### GET /dashboard/graph

Get architecture graph data for visualization.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "uuid",
        "label": "SAP ERP",
        "type": "ERP",
        "status": "PRODUCTION",
        "criticality": "CRITICAL"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "uuid-1",
        "target": "uuid-2",
        "label": "API Integration",
        "type": "interface"
      }
    ]
  }
}
```

---

## Impact Analysis

### GET /impact/analyze/:applicationId

Analyze the impact of changes to an application.

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid",
      "name": "Customer API",
      "type": "API",
      "criticality": "CRITICAL"
    },
    "directDependencies": [
      {
        "id": "uuid",
        "name": "Web Portal",
        "type": "FRONTEND",
        "criticality": "HIGH"
      }
    ],
    "indirectDependencies": [
      {
        "id": "uuid",
        "name": "Mobile App",
        "type": "MOBILE",
        "criticality": "MEDIUM"
      }
    ],
    "affectedInterfaces": [
      {
        "id": "uuid",
        "name": "Portal to Customer API",
        "sourceId": "uuid",
        "targetId": "uuid"
      }
    ],
    "totalImpactedSystems": 5
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request body |
| INTERNAL_ERROR | 500 | Server error |

---

## Enums Reference

### ApplicationType
- CRM, ERP, API, BACKEND, SAAS, MICROSERVICE, DATABASE, MIDDLEWARE, FRONTEND, MOBILE, OTHER

### LifecycleStatus
- PLANNING, DEVELOPMENT, TESTING, PRODUCTION, DEPRECATED, RETIRED

### BusinessCriticality
- CRITICAL, HIGH, MEDIUM, LOW

### TechnologyStatus
- EMERGING, CURRENT, RETIRING, OBSOLETE

### IntegrationType
- REST, SOAP, GRAPHQL, GRPC, MESSAGE_QUEUE, FILE_TRANSFER, DATABASE_LINK, ETL, OTHER

### PersonRole
- OWNER, ARCHITECT, DEVELOPER, ADMIN, STAKEHOLDER

### DependencyType
- RUNTIME, DATA, INFRASTRUCTURE, SERVICE
