import { query } from '../config/database';
import { SystemInterface, IntegrationType, BusinessCriticality, PaginatedResponse } from '../types';

export interface InterfaceFilters {
  integration_type?: IntegrationType;
  criticality?: BusinessCriticality;
  source_application_id?: number;
  target_application_id?: number;
  search?: string;
}

export interface CreateInterfaceDTO {
  name: string;
  source_application_id: number;
  target_application_id: number;
  integration_type: IntegrationType;
  technology_id?: number;
  description?: string;
  criticality: BusinessCriticality;
  data_format?: string;
  frequency?: string;
}

export interface UpdateInterfaceDTO extends Partial<CreateInterfaceDTO> {}

export const interfaceService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: InterfaceFilters
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.integration_type) {
      whereClause += ` AND si.integration_type = $${paramIndex++}`;
      params.push(filters.integration_type);
    }
    if (filters?.criticality) {
      whereClause += ` AND si.criticality = $${paramIndex++}`;
      params.push(filters.criticality);
    }
    if (filters?.source_application_id) {
      whereClause += ` AND si.source_application_id = $${paramIndex++}`;
      params.push(filters.source_application_id);
    }
    if (filters?.target_application_id) {
      whereClause += ` AND si.target_application_id = $${paramIndex++}`;
      params.push(filters.target_application_id);
    }
    if (filters?.search) {
      whereClause += ` AND (si.name ILIKE $${paramIndex} OR si.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM system_interfaces si ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT si.*, 
              sa.name as source_application_name,
              ta.name as target_application_name,
              t.name as technology_name
       FROM system_interfaces si
       LEFT JOIN applications sa ON si.source_application_id = sa.id
       LEFT JOIN applications ta ON si.target_application_id = ta.id
       LEFT JOIN technologies t ON si.technology_id = t.id
       ${whereClause}
       ORDER BY si.name ASC 
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
      `SELECT si.*, 
              sa.name as source_application_name,
              ta.name as target_application_name,
              t.name as technology_name
       FROM system_interfaces si
       LEFT JOIN applications sa ON si.source_application_id = sa.id
       LEFT JOIN applications ta ON si.target_application_id = ta.id
       LEFT JOIN technologies t ON si.technology_id = t.id
       WHERE si.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: CreateInterfaceDTO): Promise<SystemInterface> {
    const result = await query(
      `INSERT INTO system_interfaces 
       (name, source_application_id, target_application_id, integration_type, technology_id, description, criticality, data_format, frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.name,
        data.source_application_id,
        data.target_application_id,
        data.integration_type,
        data.technology_id,
        data.description,
        data.criticality,
        data.data_format,
        data.frequency
      ]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdateInterfaceDTO): Promise<SystemInterface | null> {
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
      `UPDATE system_interfaces SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM system_interfaces WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getByApplication(applicationId: number): Promise<any[]> {
    const result = await query(
      `SELECT si.*, 
              sa.name as source_application_name,
              ta.name as target_application_name,
              t.name as technology_name
       FROM system_interfaces si
       LEFT JOIN applications sa ON si.source_application_id = sa.id
       LEFT JOIN applications ta ON si.target_application_id = ta.id
       LEFT JOIN technologies t ON si.technology_id = t.id
       WHERE si.source_application_id = $1 OR si.target_application_id = $1
       ORDER BY si.name`,
      [applicationId]
    );
    return result.rows;
  }
};
