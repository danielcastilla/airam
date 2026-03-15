import { query } from '../config/database';
import { Dependency, DependencyType, PaginatedResponse } from '../types';

export interface DependencyFilters {
  dependency_type?: DependencyType;
  source_application_id?: number;
  target_application_id?: number;
  is_critical?: boolean;
}

export interface CreateDependencyDTO {
  source_application_id: number;
  target_application_id: number;
  dependency_type: DependencyType;
  description?: string;
  is_critical: boolean;
}

export interface UpdateDependencyDTO extends Partial<CreateDependencyDTO> {}

export const dependencyService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: DependencyFilters
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.dependency_type) {
      whereClause += ` AND d.dependency_type = $${paramIndex++}`;
      params.push(filters.dependency_type);
    }
    if (filters?.source_application_id) {
      whereClause += ` AND d.source_application_id = $${paramIndex++}`;
      params.push(filters.source_application_id);
    }
    if (filters?.target_application_id) {
      whereClause += ` AND d.target_application_id = $${paramIndex++}`;
      params.push(filters.target_application_id);
    }
    if (filters?.is_critical !== undefined) {
      whereClause += ` AND d.is_critical = $${paramIndex++}`;
      params.push(filters.is_critical);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM dependencies d ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT d.*, 
              sa.name as source_application_name,
              ta.name as target_application_name
       FROM dependencies d
       LEFT JOIN applications sa ON d.source_application_id = sa.id
       LEFT JOIN applications ta ON d.target_application_id = ta.id
       ${whereClause}
       ORDER BY d.created_at DESC 
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

  async findById(id: number): Promise<any | null> {
    const result = await query(
      `SELECT d.*, 
              sa.name as source_application_name,
              ta.name as target_application_name
       FROM dependencies d
       LEFT JOIN applications sa ON d.source_application_id = sa.id
       LEFT JOIN applications ta ON d.target_application_id = ta.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: CreateDependencyDTO): Promise<Dependency> {
    const result = await query(
      `INSERT INTO dependencies 
       (source_application_id, target_application_id, dependency_type, description, is_critical)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.source_application_id,
        data.target_application_id,
        data.dependency_type,
        data.description,
        data.is_critical
      ]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdateDependencyDTO): Promise<Dependency | null> {
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
      `UPDATE dependencies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM dependencies WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getByApplication(applicationId: number): Promise<any[]> {
    const result = await query(
      `SELECT d.*, 
              sa.name as source_application_name,
              ta.name as target_application_name
       FROM dependencies d
       LEFT JOIN applications sa ON d.source_application_id = sa.id
       LEFT JOIN applications ta ON d.target_application_id = ta.id
       WHERE d.source_application_id = $1 OR d.target_application_id = $1
       ORDER BY d.is_critical DESC, d.dependency_type`,
      [applicationId]
    );
    return result.rows;
  }
};
