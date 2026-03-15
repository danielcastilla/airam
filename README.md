# AIRAM - Architecture Information & Resource Analytics Manager

Sistema de gestión de arquitectura empresarial (EAM) para visualizar y administrar el mapa tecnológico de una organización.

## 🎯 Características Principales

- **Inventario de Aplicaciones**: Gestión completa del catálogo de aplicaciones
- **Gestión de Dependencias**: Mapeo de relaciones entre sistemas
- **Gestión de Tecnologías**: Registro y estado de tecnologías
- **Gestión de Interfaces**: Integraciones entre sistemas
- **Análisis de Impacto**: Visualización de dependencias directas e indirectas
- **Modernización**: Identificación de tecnologías obsoletas

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    React + TypeScript                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │Dashboard │  │Inventory │  │Graph     │  │Impact Analysis   ││
│  │          │  │Management│  │Visualizer│  │                  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│                         Cytoscape.js                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    Node.js + Express                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │Auth      │  │Apps      │  │Tech      │  │Interfaces        ││
│  │Controller│  │Controller│  │Controller│  │Controller        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│                         Services Layer                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │Application│ │Technology│  │Interface │  │Person            ││
│  │Dependency │ │App_Tech  │  │          │  │                  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
airam/
├── backend/                 # API REST Node.js
│   ├── src/
│   │   ├── config/         # Configuración
│   │   ├── controllers/    # Controladores REST
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   └── utils/          # Utilidades
│   └── package.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas/Vistas
│   │   ├── services/       # Servicios API
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilidades
│   └── package.json
├── database/               # Scripts SQL
│   ├── schema.sql          # Esquema de BD
│   ├── seed.sql            # Datos iniciales
│   └── migrations/         # Migraciones
└── docs/                   # Documentación
    ├── api.md              # Documentación API
    └── architecture.md     # Documentación técnica
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

1. **Clonar repositorio**
```bash
git clone <repository-url>
cd airam
```

2. **Configurar base de datos**
```bash
psql -U postgres -f database/schema.sql
psql -U postgres -f database/seed.sql
```

3. **Instalar dependencias del backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

4. **Instalar dependencias del frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📊 Modelo de Datos

### Entidades Principales

| Entidad | Descripción |
|---------|-------------|
| Application | Aplicaciones y sistemas |
| Technology | Tecnologías utilizadas |
| SystemInterface | Interfaces entre sistemas |
| Person | Responsables y equipos |
| Dependency | Dependencias entre aplicaciones |

## 🔐 Autenticación

JWT (JSON Web Tokens) con refresh tokens.

## 📝 API Endpoints

Ver [docs/api.md](docs/api.md) para documentación completa.

## 📄 Licencia

MIT License
