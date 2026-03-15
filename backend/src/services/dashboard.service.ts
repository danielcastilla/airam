import { query } from '../config/database';
import { DashboardStats, ArchitectureGraph, GraphNode, GraphEdge } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    // Total applications
    const totalAppsResult = await query('SELECT COUNT(*) FROM applications');
    const totalApplications = parseInt(totalAppsResult.rows[0].count);

    // Applications by type
    const appsByTypeResult = await query(
      `SELECT type, COUNT(*) as count FROM applications GROUP BY type`
    );
    const applicationsByType: Record<string, number> = {};
    appsByTypeResult.rows.forEach(row => {
      applicationsByType[row.type] = parseInt(row.count);
    });

    // Applications by status
    const appsByStatusResult = await query(
      `SELECT lifecycle_status, COUNT(*) as count FROM applications GROUP BY lifecycle_status`
    );
    const applicationsByStatus: Record<string, number> = {};
    appsByStatusResult.rows.forEach(row => {
      applicationsByStatus[row.lifecycle_status] = parseInt(row.count);
    });

    // Applications by criticality
    const appsByCriticalityResult = await query(
      `SELECT business_criticality, COUNT(*) as count FROM applications GROUP BY business_criticality`
    );
    const applicationsByCriticality: Record<string, number> = {};
    appsByCriticalityResult.rows.forEach(row => {
      applicationsByCriticality[row.business_criticality] = parseInt(row.count);
    });

    // Total technologies
    const totalTechResult = await query('SELECT COUNT(*) FROM technologies');
    const totalTechnologies = parseInt(totalTechResult.rows[0].count);

    // Obsolete technologies
    const obsoleteTechResult = await query(
      `SELECT COUNT(*) FROM technologies 
       WHERE status IN ('DEPRECATED', 'OBSOLETE') 
       OR (end_of_life_date IS NOT NULL AND end_of_life_date < NOW())`
    );
    const obsoleteTechnologies = parseInt(obsoleteTechResult.rows[0].count);

    // Total interfaces
    const totalInterfacesResult = await query('SELECT COUNT(*) FROM system_interfaces');
    const totalInterfaces = parseInt(totalInterfacesResult.rows[0].count);

    // Total dependencies
    const totalDepsResult = await query('SELECT COUNT(*) FROM dependencies');
    const totalDependencies = parseInt(totalDepsResult.rows[0].count);

    // Most connected applications
    const mostConnectedResult = await query(`
      SELECT 
        a.id,
        a.name,
        (
          SELECT COUNT(*) FROM dependencies WHERE source_application_id = a.id OR target_application_id = a.id
        ) + (
          SELECT COUNT(*) FROM system_interfaces WHERE source_application_id = a.id OR target_application_id = a.id
        ) as connection_count
      FROM applications a
      ORDER BY connection_count DESC
      LIMIT 10
    `);
    const mostConnectedApplications = mostConnectedResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      connectionCount: parseInt(row.connection_count)
    }));

    return {
      totalApplications,
      applicationsByType: applicationsByType as any,
      applicationsByStatus: applicationsByStatus as any,
      applicationsByCriticality: applicationsByCriticality as any,
      totalTechnologies,
      obsoleteTechnologies,
      totalInterfaces,
      totalDependencies,
      mostConnectedApplications
    };
  },

  async getArchitectureGraph(): Promise<ArchitectureGraph> {
    // Get all applications as nodes
    const appsResult = await query(
      `SELECT id, name, type, lifecycle_status, business_criticality, description
       FROM applications`
    );

    const nodes: GraphNode[] = appsResult.rows.map(app => ({
      id: `app-${app.id}`,
      label: app.name,
      type: app.type,
      status: app.lifecycle_status,
      criticality: app.business_criticality,
      metadata: {
        description: app.description
      }
    }));

    // Get dependencies as edges
    const depsResult = await query(
      `SELECT id, source_application_id, target_application_id, dependency_type, is_critical
       FROM dependencies`
    );

    const dependencyEdges: GraphEdge[] = depsResult.rows.map(dep => ({
      id: `dep-${dep.id}`,
      source: `app-${dep.source_application_id}`,
      target: `app-${dep.target_application_id}`,
      label: dep.dependency_type,
      type: 'dependency' as const,
      metadata: {
        isCritical: dep.is_critical
      }
    }));

    // Get interfaces as edges
    const interfacesResult = await query(
      `SELECT id, source_application_id, target_application_id, integration_type, criticality, name
       FROM system_interfaces`
    );

    const interfaceEdges: GraphEdge[] = interfacesResult.rows.map(iface => ({
      id: `iface-${iface.id}`,
      source: `app-${iface.source_application_id}`,
      target: `app-${iface.target_application_id}`,
      label: iface.name || iface.integration_type,
      type: 'interface' as const,
      criticality: iface.criticality,
      metadata: {
        integrationType: iface.integration_type
      }
    }));

    return {
      nodes,
      edges: [...dependencyEdges, ...interfaceEdges]
    };
  },

  async getLegacyApplications(): Promise<any[]> {
    const result = await query(`
      SELECT a.*, 
             array_agg(DISTINCT t.name) as technologies
      FROM applications a
      LEFT JOIN application_technologies at ON a.id = at.application_id
      LEFT JOIN technologies t ON at.technology_id = t.id
      WHERE a.lifecycle_status IN ('DEPRECATED', 'MAINTENANCE')
         OR EXISTS (
           SELECT 1 FROM application_technologies at2
           JOIN technologies t2 ON at2.technology_id = t2.id
           WHERE at2.application_id = a.id 
           AND t2.status IN ('DEPRECATED', 'OBSOLETE')
         )
      GROUP BY a.id
      ORDER BY a.business_criticality DESC, a.name
    `);
    return result.rows;
  }
};
