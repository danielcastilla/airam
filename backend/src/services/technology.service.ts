import { query } from '../config/database';
import { Technology, TechnologyStatus, PaginatedResponse } from '../types';

export interface TechnologyFilters {
  status?: TechnologyStatus;
  category?: string;
  search?: string;
}

export interface CreateTechnologyDTO {
  name: string;
  version?: string;
  category: string;
  status: TechnologyStatus;
  end_of_life_date?: Date;
  description?: string;
  documentation_url?: string;
}

export interface UpdateTechnologyDTO extends Partial<CreateTechnologyDTO> {}

export const technologyService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: TechnologyFilters
  ): Promise<PaginatedResponse<Technology>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }
    if (filters?.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM technologies ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM technologies ${whereClause} 
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

  async findById(id: number): Promise<Technology | null> {
    const result = await query('SELECT * FROM technologies WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateTechnologyDTO): Promise<Technology> {
    const result = await query(
      `INSERT INTO technologies 
       (name, version, category, status, end_of_life_date, description, documentation_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.name,
        data.version,
        data.category,
        data.status,
        data.end_of_life_date,
        data.description,
        data.documentation_url
      ]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdateTechnologyDTO): Promise<Technology | null> {
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
      `UPDATE technologies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM technologies WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getObsolete(): Promise<Technology[]> {
    const result = await query(
      `SELECT * FROM technologies 
       WHERE status IN ('DEPRECATED', 'OBSOLETE')
       OR (end_of_life_date IS NOT NULL AND end_of_life_date < NOW())
       ORDER BY end_of_life_date ASC`
    );
    return result.rows;
  },

  async getCategories(): Promise<string[]> {
    const result = await query(
      'SELECT DISTINCT category FROM technologies ORDER BY category'
    );
    return result.rows.map(row => row.category);
  },

  async getApplications(technologyId: number): Promise<any[]> {
    const result = await query(
      `SELECT a.*, at.usage_type, at.notes 
       FROM applications a
       JOIN application_technologies at ON a.id = at.application_id
       WHERE at.technology_id = $1`,
      [technologyId]
    );
    return result.rows;
  }
};
