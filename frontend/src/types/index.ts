// ============================================
// ENUMS
// ============================================

export enum ApplicationType {
  CRM = 'CRM',
  ERP = 'ERP',
  API = 'API',
  BACKEND = 'BACKEND',
  SAAS = 'SAAS',
  MICROSERVICE = 'MICROSERVICE',
  DATABASE = 'DATABASE',
  MIDDLEWARE = 'MIDDLEWARE',
  FRONTEND = 'FRONTEND',
  MOBILE = 'MOBILE',
  OTHER = 'OTHER'
}

export enum LifecycleStatus {
  PLANNING = 'PLANNING',
  DEVELOPMENT = 'DEVELOPMENT',
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DEPRECATED = 'DEPRECATED',
  RETIRED = 'RETIRED'
}

export enum BusinessCriticality {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TechnologyStatus {
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  OBSOLETE = 'OBSOLETE',
  EMERGING = 'EMERGING'
}

export enum IntegrationType {
  REST_API = 'REST_API',
  SOAP = 'SOAP',
  GRAPHQL = 'GRAPHQL',
  BATCH = 'BATCH',
  EVENT = 'EVENT',
  SHARED_DATABASE = 'SHARED_DATABASE',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  FILE_TRANSFER = 'FILE_TRANSFER',
  GRPC = 'GRPC'
}

export enum PersonRole {
  FUNCTIONAL_OWNER = 'FUNCTIONAL_OWNER',
  TECHNICAL_OWNER = 'TECHNICAL_OWNER',
  MAINTENANCE_TEAM = 'MAINTENANCE_TEAM',
  ARCHITECT = 'ARCHITECT',
  DEVELOPER = 'DEVELOPER'
}

export enum DependencyType {
  RUNTIME = 'RUNTIME',
  DATA = 'DATA',
  DEPLOYMENT = 'DEPLOYMENT',
  BUILD = 'BUILD'
}

export enum BusinessDomain {
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  FINANCE = 'FINANCE',
  HR = 'HR',
  OPERATIONS = 'OPERATIONS',
  IT = 'IT',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  LEGAL = 'LEGAL',
  R_AND_D = 'R_AND_D',
  OTHER = 'OTHER'
}

// ============================================
// ENTITIES
// ============================================

export interface Application {
  id: number;
  name: string;
  description: string;
  type: ApplicationType;
  lifecycle_status: LifecycleStatus;
  business_criticality: BusinessCriticality;
  department?: string;
  documentation_url?: string;
  repository_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: number;
  name: string;
  version?: string;
  category: string;
  status: TechnologyStatus;
  end_of_life_date?: string;
  description?: string;
  documentation_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemInterface {
  id: number;
  name: string;
  source_application_id: number;
  source_application_name?: string;
  target_application_id: number;
  target_application_name?: string;
  integration_type: IntegrationType;
  technology_id?: number;
  technology_name?: string;
  description?: string;
  criticality: BusinessCriticality;
  data_format?: string;
  frequency?: string;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: number;
  name: string;
  email: string;
  role: PersonRole;
  team?: string;
  department?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Dependency {
  id: number;
  source_application_id: number;
  source_application_name?: string;
  target_application_id: number;
  target_application_name?: string;
  dependency_type: DependencyType;
  description?: string;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessApplication {
  id: number;
  name: string;
  description: string;
  business_domain: BusinessDomain;
  business_criticality: BusinessCriticality;
  business_owner?: string;
  business_owner_email?: string;
  business_capability?: string;
  strategic_value?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// API TYPES
// ============================================

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// GRAPH TYPES
// ============================================

export interface GraphNode {
  id: string;
  label: string;
  type: ApplicationType;
  status: LifecycleStatus;
  criticality: BusinessCriticality;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'dependency' | 'interface';
  criticality?: BusinessCriticality;
  metadata?: Record<string, unknown>;
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  totalApplications: number;
  applicationsByType: Record<ApplicationType, number>;
  applicationsByStatus: Record<LifecycleStatus, number>;
  applicationsByCriticality: Record<BusinessCriticality, number>;
  totalTechnologies: number;
  obsoleteTechnologies: number;
  totalInterfaces: number;
  totalDependencies: number;
  mostConnectedApplications: Array<{
    id: number;
    name: string;
    connectionCount: number;
  }>;
}

// ============================================
// IMPACT ANALYSIS
// ============================================

export interface ImpactAnalysis {
  application: Application;
  directDependents: Application[];
  indirectDependents: Application[];
  directDependencies: Application[];
  indirectDependencies: Application[];
  affectedInterfaces: SystemInterface[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
