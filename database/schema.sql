-- ============================================
-- Biztech - Enterprise Architecture Management
-- Database Schema
-- PostgreSQL 14+
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS business_application_applications CASCADE;
DROP TABLE IF EXISTS business_applications CASCADE;
DROP TABLE IF EXISTS application_persons CASCADE;
DROP TABLE IF EXISTS application_technologies CASCADE;
DROP TABLE IF EXISTS dependencies CASCADE;
DROP TABLE IF EXISTS system_interfaces CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS technologies CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- ENUM TYPES
-- ============================================

DROP TYPE IF EXISTS application_type CASCADE;
CREATE TYPE application_type AS ENUM (
  'CRM', 'ERP', 'API', 'BACKEND', 'SAAS', 'MICROSERVICE', 
  'DATABASE', 'MIDDLEWARE', 'FRONTEND', 'MOBILE', 'OTHER'
);

DROP TYPE IF EXISTS lifecycle_status CASCADE;
CREATE TYPE lifecycle_status AS ENUM (
  'PLANNING', 'DEVELOPMENT', 'ACTIVE', 'MAINTENANCE', 'DEPRECATED', 'RETIRED'
);

DROP TYPE IF EXISTS business_criticality CASCADE;
CREATE TYPE business_criticality AS ENUM (
  'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
);

DROP TYPE IF EXISTS technology_status CASCADE;
CREATE TYPE technology_status AS ENUM (
  'ACTIVE', 'DEPRECATED', 'OBSOLETE', 'EMERGING'
);

DROP TYPE IF EXISTS integration_type CASCADE;
CREATE TYPE integration_type AS ENUM (
  'REST_API', 'SOAP', 'GRAPHQL', 'BATCH', 'EVENT', 
  'SHARED_DATABASE', 'MESSAGE_QUEUE', 'FILE_TRANSFER', 'GRPC'
);

DROP TYPE IF EXISTS person_role CASCADE;
CREATE TYPE person_role AS ENUM (
  'FUNCTIONAL_OWNER', 'TECHNICAL_OWNER', 'MAINTENANCE_TEAM', 'ARCHITECT', 'DEVELOPER', 'ADMIN'
);

DROP TYPE IF EXISTS dependency_type CASCADE;
CREATE TYPE dependency_type AS ENUM (
  'RUNTIME', 'DATA', 'DEPLOYMENT', 'BUILD'
);

DROP TYPE IF EXISTS business_domain CASCADE;
CREATE TYPE business_domain AS ENUM (
  'SALES', 'MARKETING', 'FINANCE', 'HR', 'OPERATIONS', 'IT',
  'CUSTOMER_SERVICE', 'SUPPLY_CHAIN', 'LEGAL', 'R_AND_D', 'OTHER'
);

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'admin', 'editor', 'viewer'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================

CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type application_type NOT NULL,
  lifecycle_status lifecycle_status NOT NULL,
  business_criticality business_criticality NOT NULL,
  department VARCHAR(255),
  documentation_url VARCHAR(500),
  repository_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_name ON applications(name);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_status ON applications(lifecycle_status);
CREATE INDEX idx_applications_criticality ON applications(business_criticality);

-- ============================================
-- TECHNOLOGIES TABLE
-- ============================================

CREATE TABLE technologies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  category VARCHAR(100) NOT NULL,
  status technology_status NOT NULL,
  end_of_life_date DATE,
  description TEXT,
  documentation_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_technologies_name ON technologies(name);
CREATE INDEX idx_technologies_category ON technologies(category);
CREATE INDEX idx_technologies_status ON technologies(status);

-- ============================================
-- SYSTEM INTERFACES TABLE
-- ============================================

CREATE TABLE system_interfaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  target_application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  integration_type integration_type NOT NULL,
  technology_id INTEGER REFERENCES technologies(id) ON DELETE SET NULL,
  description TEXT,
  criticality business_criticality NOT NULL,
  data_format VARCHAR(100),
  frequency VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_different_apps CHECK (source_application_id != target_application_id)
);

CREATE INDEX idx_interfaces_source ON system_interfaces(source_application_id);
CREATE INDEX idx_interfaces_target ON system_interfaces(target_application_id);
CREATE INDEX idx_interfaces_type ON system_interfaces(integration_type);

-- ============================================
-- PERSONS TABLE
-- ============================================

CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role person_role NOT NULL,
  team VARCHAR(255),
  department VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_role ON persons(role);
CREATE INDEX idx_persons_team ON persons(team);

-- ============================================
-- DEPENDENCIES TABLE
-- ============================================

CREATE TABLE dependencies (
  id SERIAL PRIMARY KEY,
  source_application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  target_application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  dependency_type dependency_type NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_different_dep_apps CHECK (source_application_id != target_application_id),
  UNIQUE (source_application_id, target_application_id, dependency_type)
);

CREATE INDEX idx_dependencies_source ON dependencies(source_application_id);
CREATE INDEX idx_dependencies_target ON dependencies(target_application_id);
CREATE INDEX idx_dependencies_type ON dependencies(dependency_type);
CREATE INDEX idx_dependencies_critical ON dependencies(is_critical);

-- ============================================
-- BUSINESS APPLICATIONS TABLE
-- ============================================

CREATE TABLE business_applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  business_domain business_domain NOT NULL,
  business_criticality business_criticality NOT NULL,
  business_owner VARCHAR(255),
  business_owner_email VARCHAR(255),
  business_capability VARCHAR(255),
  strategic_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_apps_name ON business_applications(name);
CREATE INDEX idx_business_apps_domain ON business_applications(business_domain);
CREATE INDEX idx_business_apps_criticality ON business_applications(business_criticality);

-- ============================================
-- BUSINESS APPLICATION - APPLICATIONS (Many-to-Many)
-- ============================================

CREATE TABLE business_application_applications (
  id SERIAL PRIMARY KEY,
  business_application_id INTEGER NOT NULL REFERENCES business_applications(id) ON DELETE CASCADE,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (business_application_id, application_id)
);

CREATE INDEX idx_ba_apps_ba ON business_application_applications(business_application_id);
CREATE INDEX idx_ba_apps_app ON business_application_applications(application_id);

-- ============================================
-- APPLICATION TECHNOLOGIES (Many-to-Many)
-- ============================================

CREATE TABLE application_technologies (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  usage_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (application_id, technology_id)
);

CREATE INDEX idx_app_tech_app ON application_technologies(application_id);
CREATE INDEX idx_app_tech_tech ON application_technologies(technology_id);

-- ============================================
-- APPLICATION PERSONS (Many-to-Many)
-- ============================================

CREATE TABLE application_persons (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  role person_role NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (application_id, person_id, role)
);

CREATE INDEX idx_app_person_app ON application_persons(application_id);
CREATE INDEX idx_app_person_person ON application_persons(person_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technologies_updated_at
    BEFORE UPDATE ON technologies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interfaces_updated_at
    BEFORE UPDATE ON system_interfaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependencies_updated_at
    BEFORE UPDATE ON dependencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_applications_updated_at
    BEFORE UPDATE ON business_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CUSTOM ATTRIBUTES SYSTEM
-- ============================================

-- Entity types that support custom attributes
DROP TYPE IF EXISTS entity_type CASCADE;
CREATE TYPE entity_type AS ENUM (
  'BUSINESS_APPLICATION', 'APPLICATION', 'TECHNOLOGY', 'INTERFACE', 'DEPENDENCY'
);

-- Field types for custom attributes
DROP TYPE IF EXISTS field_type CASCADE;
CREATE TYPE field_type AS ENUM (
  'STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'TEXTAREA', 'URL', 'EMAIL'
);

-- Custom attribute sections (for grouping attributes)
DROP TABLE IF EXISTS custom_attribute_values CASCADE;
DROP TABLE IF EXISTS custom_attribute_definitions CASCADE;
DROP TABLE IF EXISTS custom_attribute_sections CASCADE;

CREATE TABLE custom_attribute_sections (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (entity_type, name)
);

CREATE INDEX idx_cas_entity ON custom_attribute_sections(entity_type);
CREATE INDEX idx_cas_order ON custom_attribute_sections(display_order);

-- Custom attribute definitions
CREATE TABLE custom_attribute_definitions (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  section_id INTEGER REFERENCES custom_attribute_sections(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type field_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  options JSONB, -- For SELECT type: [{"value": "opt1", "label": "Option 1"}, ...]
  validation_rules JSONB, -- min, max, pattern, etc.
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (entity_type, name)
);

CREATE INDEX idx_cad_entity ON custom_attribute_definitions(entity_type);
CREATE INDEX idx_cad_section ON custom_attribute_definitions(section_id);
CREATE INDEX idx_cad_order ON custom_attribute_definitions(display_order);
CREATE INDEX idx_cad_active ON custom_attribute_definitions(is_active);

-- Custom attribute values
CREATE TABLE custom_attribute_values (
  id SERIAL PRIMARY KEY,
  attribute_id INTEGER NOT NULL REFERENCES custom_attribute_definitions(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  value_string TEXT,
  value_number DECIMAL(20,6),
  value_boolean BOOLEAN,
  value_date DATE,
  value_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (attribute_id, entity_type, entity_id)
);

CREATE INDEX idx_cav_attribute ON custom_attribute_values(attribute_id);
CREATE INDEX idx_cav_entity ON custom_attribute_values(entity_type, entity_id);

-- Triggers for updated_at
CREATE TRIGGER update_custom_sections_updated_at
    BEFORE UPDATE ON custom_attribute_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_definitions_updated_at
    BEFORE UPDATE ON custom_attribute_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_values_updated_at
    BEFORE UPDATE ON custom_attribute_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
