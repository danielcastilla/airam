import { query } from '../config/database';
import { ImpactAnalysis, Application } from '../types';

export const impactService = {
  async analyzeImpact(applicationId: number): Promise<ImpactAnalysis> {
    // Get the application
    const appResult = await query('SELECT * FROM applications WHERE id = $1', [applicationId]);
    if (!appResult.rows[0]) {
      throw new Error('Application not found');
    }
    const application = appResult.rows[0];

    // Get direct dependents (applications that depend on this one)
    const directDependentsResult = await query(
      `SELECT a.* FROM applications a
       JOIN dependencies d ON a.id = d.source_application_id
       WHERE d.target_application_id = $1`,
      [applicationId]
    );
    const directDependents = directDependentsResult.rows;

    // Get indirect dependents (recursive)
    const indirectDependentsResult = await query(
      `WITH RECURSIVE dependent_apps AS (
         SELECT a.*, 1 as depth
         FROM applications a
         JOIN dependencies d ON a.id = d.source_application_id
         WHERE d.target_application_id = $1
         
         UNION
         
         SELECT a.*, da.depth + 1
         FROM applications a
         JOIN dependencies d ON a.id = d.source_application_id
         JOIN dependent_apps da ON d.target_application_id = da.id
         WHERE da.depth < 5
       )
       SELECT DISTINCT ON (id) * FROM dependent_apps 
       WHERE id != $1 
       AND id NOT IN (
         SELECT a.id FROM applications a
         JOIN dependencies d ON a.id = d.source_application_id
         WHERE d.target_application_id = $1
       )
       ORDER BY id, depth`,
      [applicationId]
    );
    const indirectDependents = indirectDependentsResult.rows;

    // Get direct dependencies (applications this one depends on)
    const directDependenciesResult = await query(
      `SELECT a.* FROM applications a
       JOIN dependencies d ON a.id = d.target_application_id
       WHERE d.source_application_id = $1`,
      [applicationId]
    );
    const directDependencies = directDependenciesResult.rows;

    // Get indirect dependencies (recursive)
    const indirectDependenciesResult = await query(
      `WITH RECURSIVE dependency_apps AS (
         SELECT a.*, 1 as depth
         FROM applications a
         JOIN dependencies d ON a.id = d.target_application_id
         WHERE d.source_application_id = $1
         
         UNION
         
         SELECT a.*, da.depth + 1
         FROM applications a
         JOIN dependencies d ON a.id = d.target_application_id
         JOIN dependency_apps da ON d.source_application_id = da.id
         WHERE da.depth < 5
       )
       SELECT DISTINCT ON (id) * FROM dependency_apps 
       WHERE id != $1
       AND id NOT IN (
         SELECT a.id FROM applications a
         JOIN dependencies d ON a.id = d.target_application_id
         WHERE d.source_application_id = $1
       )
       ORDER BY id, depth`,
      [applicationId]
    );
    const indirectDependencies = indirectDependenciesResult.rows;

    // Get affected interfaces
    const interfacesResult = await query(
      `SELECT si.*, 
              sa.name as source_application_name,
              ta.name as target_application_name
       FROM system_interfaces si
       LEFT JOIN applications sa ON si.source_application_id = sa.id
       LEFT JOIN applications ta ON si.target_application_id = ta.id
       WHERE si.source_application_id = $1 OR si.target_application_id = $1`,
      [applicationId]
    );
    const affectedInterfaces = interfacesResult.rows;

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      application,
      directDependents,
      indirectDependents,
      affectedInterfaces
    );

    return {
      application,
      directDependents,
      indirectDependents,
      directDependencies,
      indirectDependencies,
      affectedInterfaces,
      riskLevel
    };
  },

  calculateRiskLevel(
    application: Application,
    directDependents: Application[],
    indirectDependents: Application[],
    affectedInterfaces: any[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let riskScore = 0;

    // Base risk from application criticality
    switch (application.business_criticality) {
      case 'CRITICAL': riskScore += 40; break;
      case 'HIGH': riskScore += 30; break;
      case 'MEDIUM': riskScore += 20; break;
      case 'LOW': riskScore += 10; break;
    }

    // Risk from dependents
    riskScore += directDependents.length * 5;
    riskScore += indirectDependents.length * 2;

    // Risk from critical dependents
    const criticalDependents = [...directDependents, ...indirectDependents].filter(
      app => app.business_criticality === 'CRITICAL'
    );
    riskScore += criticalDependents.length * 10;

    // Risk from interfaces
    riskScore += affectedInterfaces.length * 3;

    // Risk from critical interfaces
    const criticalInterfaces = affectedInterfaces.filter(
      iface => iface.criticality === 'CRITICAL'
    );
    riskScore += criticalInterfaces.length * 8;

    // Determine risk level
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  },

  async getDependencyChain(sourceId: number, targetId: number): Promise<any[]> {
    const result = await query(
      `WITH RECURSIVE path AS (
         SELECT 
           $1::int as current_id,
           ARRAY[$1::int] as path,
           0 as depth
         
         UNION ALL
         
         SELECT 
           d.target_application_id,
           p.path || d.target_application_id,
           p.depth + 1
         FROM path p
         JOIN dependencies d ON d.source_application_id = p.current_id
         WHERE d.target_application_id != ALL(p.path)
           AND p.depth < 10
           AND d.target_application_id = $2
       )
       SELECT path FROM path WHERE current_id = $2
       ORDER BY depth
       LIMIT 1`,
      [sourceId, targetId]
    );

    if (!result.rows[0]) {
      return [];
    }

    const pathIds = result.rows[0].path;
    const appsResult = await query(
      `SELECT * FROM applications WHERE id = ANY($1::int[])`,
      [pathIds]
    );

    // Order by path
    const appsMap = new Map(appsResult.rows.map(app => [app.id, app]));
    return pathIds.map((id: number) => appsMap.get(id)).filter(Boolean);
  }
};
