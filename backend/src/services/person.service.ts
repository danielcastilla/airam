import { query } from '../config/database';
import { Person, PersonRole, PaginatedResponse } from '../types';

export interface PersonFilters {
  role?: PersonRole;
  team?: string;
  department?: string;
  search?: string;
}

export interface CreatePersonDTO {
  name: string;
  email: string;
  role: PersonRole;
  team?: string;
  department?: string;
  phone?: string;
}

export interface UpdatePersonDTO extends Partial<CreatePersonDTO> {}

export const personService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: PersonFilters
  ): Promise<PaginatedResponse<Person>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.role) {
      whereClause += ` AND role = $${paramIndex++}`;
      params.push(filters.role);
    }
    if (filters?.team) {
      whereClause += ` AND team = $${paramIndex++}`;
      params.push(filters.team);
    }
    if (filters?.department) {
      whereClause += ` AND department = $${paramIndex++}`;
      params.push(filters.department);
    }
    if (filters?.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM persons ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM persons ${whereClause} 
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

  async findById(id: number): Promise<Person | null> {
    const result = await query('SELECT * FROM persons WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<Person | null> {
    const result = await query('SELECT * FROM persons WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async create(data: CreatePersonDTO): Promise<Person> {
    const result = await query(
      `INSERT INTO persons 
       (name, email, role, team, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, data.email, data.role, data.team, data.department, data.phone]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdatePersonDTO): Promise<Person | null> {
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
      `UPDATE persons SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM persons WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getApplications(personId: number): Promise<any[]> {
    const result = await query(
      `SELECT a.*, ap.role as assignment_role, ap.start_date, ap.end_date
       FROM applications a
       JOIN application_persons ap ON a.id = ap.application_id
       WHERE ap.person_id = $1
       ORDER BY a.name`,
      [personId]
    );
    return result.rows;
  },

  async getTeams(): Promise<string[]> {
    const result = await query(
      'SELECT DISTINCT team FROM persons WHERE team IS NOT NULL ORDER BY team'
    );
    return result.rows.map(row => row.team);
  },

  async getDepartments(): Promise<string[]> {
    const result = await query(
      'SELECT DISTINCT department FROM persons WHERE department IS NOT NULL ORDER BY department'
    );
    return result.rows.map(row => row.department);
  }
};
