-- ============================================
-- Biztech - Enterprise Architecture Management
-- Seed Data
-- ============================================

-- ============================================
-- USERS (password: Admin123!)
-- ============================================

INSERT INTO users (email, password_hash, name, role) VALUES
('admin@company.com', '$2a$10$g82.75VHL6rZE0qzR.dfh.YSXJnIxmFzNEGTNmsgQajNcl252cAqK', 'Admin User', 'admin'),
('architect@company.com', '$2a$10$g82.75VHL6rZE0qzR.dfh.YSXJnIxmFzNEGTNmsgQajNcl252cAqK', 'Enterprise Architect', 'editor'),
('viewer@company.com', '$2a$10$g82.75VHL6rZE0qzR.dfh.YSXJnIxmFzNEGTNmsgQajNcl252cAqK', 'Viewer User', 'viewer');

-- ============================================
-- TECHNOLOGIES
-- ============================================

INSERT INTO technologies (name, version, category, status, end_of_life_date, description) VALUES
-- Languages
('Java', '17', 'Language', 'ACTIVE', NULL, 'Java LTS version'),
('Java', '8', 'Language', 'DEPRECATED', '2025-03-01', 'Legacy Java version'),
('TypeScript', '5.0', 'Language', 'ACTIVE', NULL, 'Typed JavaScript'),
('Python', '3.11', 'Language', 'ACTIVE', NULL, 'Python programming language'),
('.NET', '7.0', 'Language', 'ACTIVE', NULL, '.NET Framework'),
('Node.js', '20', 'Runtime', 'ACTIVE', NULL, 'JavaScript runtime'),
('Node.js', '14', 'Runtime', 'OBSOLETE', '2023-04-30', 'End of life Node version'),

-- Databases
('PostgreSQL', '15', 'Database', 'ACTIVE', NULL, 'Relational database'),
('Oracle', '19c', 'Database', 'ACTIVE', NULL, 'Enterprise database'),
('MongoDB', '6.0', 'Database', 'ACTIVE', NULL, 'NoSQL database'),
('MySQL', '5.7', 'Database', 'DEPRECATED', '2023-10-01', 'Legacy MySQL'),
('Redis', '7.0', 'Database', 'ACTIVE', NULL, 'In-memory cache'),

-- Frameworks
('Spring Boot', '3.2', 'Framework', 'ACTIVE', NULL, 'Java framework'),
('React', '18', 'Framework', 'ACTIVE', NULL, 'Frontend library'),
('Angular', '16', 'Framework', 'ACTIVE', NULL, 'Frontend framework'),
('Express', '4.18', 'Framework', 'ACTIVE', NULL, 'Node.js web framework'),

-- Infrastructure
('Kubernetes', '1.28', 'Infrastructure', 'ACTIVE', NULL, 'Container orchestration'),
('Docker', '24', 'Infrastructure', 'ACTIVE', NULL, 'Containerization'),
('AWS', 'Current', 'Cloud', 'ACTIVE', NULL, 'Amazon Web Services'),
('Azure', 'Current', 'Cloud', 'ACTIVE', NULL, 'Microsoft Azure'),

-- Messaging
('Kafka', '3.5', 'Messaging', 'ACTIVE', NULL, 'Event streaming'),
('RabbitMQ', '3.12', 'Messaging', 'ACTIVE', NULL, 'Message broker'),

-- Legacy
('COBOL', 'Legacy', 'Language', 'OBSOLETE', '2020-01-01', 'Mainframe language'),
('AS/400', 'Legacy', 'Infrastructure', 'OBSOLETE', '2018-01-01', 'IBM midrange');

-- ============================================
-- APPLICATIONS
-- ============================================

INSERT INTO applications (name, description, type, lifecycle_status, business_criticality, department, documentation_url, repository_url) VALUES
-- Core Business
('SAP ERP', 'Enterprise Resource Planning system for finance, HR, and operations', 'ERP', 'ACTIVE', 'CRITICAL', 'Finance', 'https://wiki.company.com/sap', NULL),
('Salesforce CRM', 'Customer Relationship Management platform', 'CRM', 'ACTIVE', 'CRITICAL', 'Sales', 'https://wiki.company.com/salesforce', NULL),
('Core Banking', 'Main banking transaction system', 'BACKEND', 'ACTIVE', 'CRITICAL', 'Operations', 'https://wiki.company.com/core-banking', NULL),

-- APIs & Microservices
('Customer API', 'RESTful API for customer data', 'API', 'ACTIVE', 'HIGH', 'IT', 'https://api.company.com/docs/customer', 'https://github.com/company/customer-api'),
('Payment Gateway', 'Payment processing microservice', 'MICROSERVICE', 'ACTIVE', 'CRITICAL', 'Payments', 'https://api.company.com/docs/payments', 'https://github.com/company/payment-gateway'),
('Notification Service', 'Email and SMS notification microservice', 'MICROSERVICE', 'ACTIVE', 'MEDIUM', 'IT', 'https://api.company.com/docs/notifications', 'https://github.com/company/notification-service'),
('Auth Service', 'Authentication and authorization service', 'MICROSERVICE', 'ACTIVE', 'CRITICAL', 'Security', 'https://api.company.com/docs/auth', 'https://github.com/company/auth-service'),

-- Frontends
('Customer Portal', 'Web application for customers', 'FRONTEND', 'ACTIVE', 'HIGH', 'Digital', 'https://wiki.company.com/portal', 'https://github.com/company/customer-portal'),
('Mobile Banking App', 'Mobile application for banking', 'MOBILE', 'ACTIVE', 'HIGH', 'Digital', 'https://wiki.company.com/mobile', 'https://github.com/company/mobile-app'),
('Internal Dashboard', 'Admin dashboard for operations', 'FRONTEND', 'ACTIVE', 'MEDIUM', 'Operations', 'https://wiki.company.com/dashboard', 'https://github.com/company/admin-dashboard'),

-- Data & Analytics
('Data Warehouse', 'Central data warehouse for analytics', 'DATABASE', 'ACTIVE', 'HIGH', 'BI', 'https://wiki.company.com/dwh', NULL),
('BI Platform', 'Business Intelligence reporting platform', 'SAAS', 'ACTIVE', 'MEDIUM', 'BI', 'https://wiki.company.com/bi', NULL),

-- Integration
('ESB', 'Enterprise Service Bus for integration', 'MIDDLEWARE', 'MAINTENANCE', 'HIGH', 'Integration', 'https://wiki.company.com/esb', NULL),
('API Gateway', 'Kong API Gateway', 'MIDDLEWARE', 'ACTIVE', 'HIGH', 'Integration', 'https://wiki.company.com/kong', NULL),

-- Legacy
('Legacy CRM', 'Old CRM system being phased out', 'CRM', 'DEPRECATED', 'LOW', 'Sales', 'https://wiki.company.com/legacy-crm', NULL),
('Mainframe Batch', 'COBOL batch processing system', 'BACKEND', 'MAINTENANCE', 'MEDIUM', 'Operations', 'https://wiki.company.com/mainframe', NULL),

-- SaaS
('Jira', 'Project management and issue tracking', 'SAAS', 'ACTIVE', 'MEDIUM', 'IT', 'https://company.atlassian.net', NULL),
('Slack', 'Team communication platform', 'SAAS', 'ACTIVE', 'MEDIUM', 'IT', 'https://company.slack.com', NULL);

-- ============================================
-- PERSONS
-- ============================================

INSERT INTO persons (name, email, role, team, department, phone) VALUES
('María García', 'maria.garcia@company.com', 'FUNCTIONAL_OWNER', 'Sales Ops', 'Sales', '+34 600 123 456'),
('Carlos López', 'carlos.lopez@company.com', 'TECHNICAL_OWNER', 'Platform', 'IT', '+34 600 234 567'),
('Ana Martínez', 'ana.martinez@company.com', 'ARCHITECT', 'Architecture', 'IT', '+34 600 345 678'),
('Pedro Sánchez', 'pedro.sanchez@company.com', 'DEVELOPER', 'Backend', 'IT', '+34 600 456 789'),
('Laura Fernández', 'laura.fernandez@company.com', 'DEVELOPER', 'Frontend', 'IT', '+34 600 567 890'),
('Juan Rodríguez', 'juan.rodriguez@company.com', 'MAINTENANCE_TEAM', 'Support', 'Operations', '+34 600 678 901'),
('Elena Torres', 'elena.torres@company.com', 'FUNCTIONAL_OWNER', 'Finance', 'Finance', '+34 600 789 012'),
('David Moreno', 'david.moreno@company.com', 'TECHNICAL_OWNER', 'Integration', 'IT', '+34 600 890 123');

-- ============================================
-- DEPENDENCIES
-- ============================================

INSERT INTO dependencies (source_application_id, target_application_id, dependency_type, description, is_critical) VALUES
-- Customer Portal dependencies
(8, 4, 'RUNTIME', 'Portal uses Customer API for data', true),
(8, 7, 'RUNTIME', 'Portal uses Auth Service for authentication', true),
(8, 6, 'RUNTIME', 'Portal uses Notification Service', false),

-- Mobile App dependencies
(9, 4, 'RUNTIME', 'Mobile app uses Customer API', true),
(9, 7, 'RUNTIME', 'Mobile app uses Auth Service', true),
(9, 5, 'RUNTIME', 'Mobile app uses Payment Gateway', true),

-- Customer API dependencies
(4, 3, 'DATA', 'Customer API reads from Core Banking', true),
(4, 2, 'DATA', 'Customer API syncs with Salesforce', false),

-- Payment Gateway dependencies
(5, 3, 'RUNTIME', 'Payment Gateway integrates with Core Banking', true),
(5, 7, 'RUNTIME', 'Payment Gateway uses Auth Service', true),

-- Core Banking dependencies
(3, 1, 'DATA', 'Core Banking syncs with SAP ERP', true),
(3, 11, 'DATA', 'Core Banking feeds Data Warehouse', false),

-- BI dependencies
(12, 11, 'DATA', 'BI Platform reads from Data Warehouse', true),

-- ESB dependencies
(13, 1, 'RUNTIME', 'ESB integrates with SAP', true),
(13, 3, 'RUNTIME', 'ESB routes to Core Banking', true);

-- ============================================
-- SYSTEM INTERFACES
-- ============================================

INSERT INTO system_interfaces (name, source_application_id, target_application_id, integration_type, technology_id, description, criticality, data_format, frequency) VALUES
-- REST APIs
('Customer Data API', 8, 4, 'REST_API', 16, 'REST API for customer information', 'HIGH', 'JSON', 'Real-time'),
('Auth API', 8, 7, 'REST_API', 16, 'OAuth 2.0 authentication', 'CRITICAL', 'JSON', 'Real-time'),
('Payment API', 9, 5, 'REST_API', 16, 'Payment processing API', 'CRITICAL', 'JSON', 'Real-time'),
('Notification API', 8, 6, 'REST_API', 16, 'Send notifications', 'MEDIUM', 'JSON', 'Real-time'),

-- Event-driven
('Customer Events', 4, 2, 'EVENT', 21, 'Customer update events via Kafka', 'HIGH', 'Avro', 'Real-time'),
('Payment Events', 5, 3, 'EVENT', 21, 'Payment transaction events', 'CRITICAL', 'Avro', 'Real-time'),

-- Batch processing
('Daily Settlement', 3, 1, 'BATCH', NULL, 'Daily financial settlement batch', 'CRITICAL', 'XML', 'Daily'),
('DWH Load', 3, 11, 'BATCH', NULL, 'Nightly data warehouse load', 'HIGH', 'CSV', 'Nightly'),

-- Database synchronization
('Legacy Sync', 3, 16, 'SHARED_DATABASE', NULL, 'Legacy system database sync', 'LOW', 'DB Link', 'Hourly'),

-- Message queues
('Order Queue', 5, 3, 'MESSAGE_QUEUE', 22, 'Order processing queue', 'HIGH', 'JSON', 'Real-time');

-- ============================================
-- APPLICATION TECHNOLOGIES
-- ============================================

INSERT INTO application_technologies (application_id, technology_id, usage_type, notes) VALUES
-- Customer API
(4, 1, 'Backend', 'Main application language'),
(4, 13, 'Framework', 'Spring Boot REST API'),
(4, 8, 'Database', 'Primary database'),
(4, 12, 'Cache', 'Session and data caching'),

-- Payment Gateway
(5, 1, 'Backend', 'Main application language'),
(5, 13, 'Framework', 'Spring Boot microservice'),
(5, 8, 'Database', 'Transaction database'),
(5, 21, 'Messaging', 'Event publishing'),

-- Customer Portal
(8, 3, 'Frontend', 'TypeScript for type safety'),
(8, 14, 'Framework', 'React SPA'),

-- Mobile App
(9, 3, 'Frontend', 'React Native'),
(9, 14, 'Framework', 'React Native framework'),

-- Auth Service
(7, 6, 'Backend', 'Node.js runtime'),
(7, 16, 'Framework', 'Express.js'),
(7, 12, 'Database', 'Token storage'),

-- Notification Service
(6, 4, 'Backend', 'Python service'),
(6, 22, 'Messaging', 'RabbitMQ for queuing'),

-- Data Warehouse
(11, 8, 'Database', 'PostgreSQL data warehouse'),
(11, 4, 'ETL', 'Python ETL scripts'),

-- Legacy systems
(16, 23, 'Backend', 'COBOL mainframe'),
(15, 2, 'Backend', 'Legacy Java application');

-- ============================================
-- APPLICATION PERSONS
-- ============================================

INSERT INTO application_persons (application_id, person_id, role, start_date) VALUES
-- Salesforce CRM
(2, 1, 'FUNCTIONAL_OWNER', '2022-01-01'),
(2, 2, 'TECHNICAL_OWNER', '2022-01-01'),

-- Customer API
(4, 3, 'ARCHITECT', '2021-06-01'),
(4, 4, 'DEVELOPER', '2021-06-01'),
(4, 2, 'TECHNICAL_OWNER', '2021-06-01'),

-- Payment Gateway
(5, 3, 'ARCHITECT', '2021-06-01'),
(5, 4, 'DEVELOPER', '2021-06-01'),

-- Customer Portal
(8, 5, 'DEVELOPER', '2022-03-01'),
(8, 3, 'ARCHITECT', '2022-03-01'),

-- SAP ERP
(1, 7, 'FUNCTIONAL_OWNER', '2020-01-01'),
(1, 8, 'TECHNICAL_OWNER', '2020-01-01'),

-- Core Banking
(3, 7, 'FUNCTIONAL_OWNER', '2019-01-01'),
(3, 6, 'MAINTENANCE_TEAM', '2019-01-01');

-- ============================================
-- BUSINESS APPLICATIONS
-- ============================================

INSERT INTO business_applications (name, description, business_domain, business_criticality, business_owner, business_owner_email, business_capability, strategic_value) VALUES
('Customer Management', 'End-to-end customer lifecycle management including acquisition, retention, and support', 'SALES', 'CRITICAL', 'María García', 'maria.garcia@company.com', 'Customer Relationship', 'Core revenue driver - enables personalized customer interactions'),
('Financial Operations', 'Financial planning, accounting, and reporting capabilities', 'FINANCE', 'CRITICAL', 'Elena Torres', 'elena.torres@company.com', 'Financial Management', 'Essential for regulatory compliance and business operations'),
('Digital Banking', 'Digital channels for customer self-service banking', 'CUSTOMER_SERVICE', 'HIGH', 'Carlos López', 'carlos.lopez@company.com', 'Digital Engagement', 'Key differentiator and cost reduction through digitalization'),
('Payment Processing', 'End-to-end payment processing and settlement', 'OPERATIONS', 'CRITICAL', 'Elena Torres', 'elena.torres@company.com', 'Payment Services', 'Core business capability with direct revenue impact'),
('Analytics & Reporting', 'Business intelligence and data analytics', 'IT', 'MEDIUM', 'Ana Martínez', 'ana.martinez@company.com', 'Decision Support', 'Enables data-driven decision making'),
('Employee Management', 'Human resources and employee lifecycle management', 'HR', 'MEDIUM', 'Juan Rodríguez', 'juan.rodriguez@company.com', 'Human Capital', 'Supports workforce management and compliance');

-- ============================================
-- BUSINESS APPLICATION - APPLICATIONS MAPPING
-- ============================================

INSERT INTO business_application_applications (business_application_id, application_id, notes) VALUES
-- Customer Management links
(1, 2, 'Primary CRM system'),
(1, 4, 'Customer data API'),
(1, 8, 'Customer self-service portal'),

-- Financial Operations links
(2, 1, 'Core ERP system'),
(2, 3, 'Banking transactions'),
(2, 11, 'Financial data warehouse'),

-- Digital Banking links
(3, 8, 'Web customer portal'),
(3, 9, 'Mobile banking app'),
(3, 7, 'Authentication services'),

-- Payment Processing links
(4, 5, 'Payment gateway'),
(4, 3, 'Core banking integration'),

-- Analytics & Reporting links
(5, 11, 'Data warehouse'),
(5, 12, 'BI platform'),

-- Employee Management links (no IT applications yet)
(6, 1, 'HR module in SAP');
