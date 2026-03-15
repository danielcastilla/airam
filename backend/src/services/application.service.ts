import { query } from '../config/database';
import { Application, ApplicationType, LifecycleStatus, BusinessCriticality, PaginatedResponse } from '../types';

export interface ApplicationFilters {
  type?: ApplicationType;
  lifecycle_status?: LifecycleStatus;
  business_criticality?: BusinessCriticality;
  search?: string;
}

export interface CreateApplicationDTO {
  name: string;
  description: string;
  type: ApplicationType;
  lifecycle_status: LifecycleStatus;
  business_criticality: BusinessCriticality;
  department?: string;
  documentation_url?: string;
  repository_url?: string;
}

export interface UpdateApplicationDTO extends Partial<CreateApplicationDTO> {}

export const applicationService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: ApplicationFilters
  ): Promise<PaginatedResponse<Application>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }
    if (filters?.lifecycle_status) {
      whereClause += ` AND lifecycle_status = $${paramIndex++}`;
      params.push(filters.lifecycle_status);
    }
    if (filters?.business_criticality) {
      whereClause += ` AND business_criticality = $${paramIndex++}`;
      params.push(filters.business_criticality);
    }
    if (filters?.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM applications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM applications ${whereClause} 
       ORDER BY name ASC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async findById(id: number): Promise<Application | null> {
    const result = await query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateApplicationDTO): Promise<Application> {
    const result = await query(
      `INSERT INTO applications 
       (name, description, type, lifecycle_status, business_criticality, department, documentation_url, repository_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.description,
        data.type,
        data.lifecycle_status,
        data.business_criticality,
        data.department,
        data.documentation_url,
        data.repository_url
      ]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdateApplicationDTO): Promise<Application | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE applications SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM applications WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getTechnologies(applicationId: number): Promise<any[]> {
    const result = await query(
      `SELECT t.*, at.usage_type, at.notes 
       FROM technologies t
       JOIN application_technologies at ON t.id = at.technology_id
       WHERE at.application_id = $1`,
      [applicationId]
    );
    return result.rows;
  },

  async addTechnology(applicationId: number, technologyId: number, usageType?: string, notes?: string): Promise<void> {
    await query(
      `INSERT INTO application_technologies (application_id, technology_id, usage_type, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (application_id, technology_id) DO UPDATE
       SET usage_type = $3, notes = $4`,
      [applicationId, technologyId, usageType, notes]
    );
  },

  async removeTechnology(applicationId: number, technologyId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM application_technologies WHERE application_id = $1 AND technology_id = $2',
      [applicationId, technologyId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getPersons(applicationId: number): Promise<any[]> {
    const result = await query(
      `SELECT p.*, ap.role as assignment_role, ap.start_date, ap.end_date
       FROM persons p
       JOIN application_persons ap ON p.id = ap.person_id
       WHERE ap.application_id = $1`,
      [applicationId]
    );
    return result.rows;
  }
};
