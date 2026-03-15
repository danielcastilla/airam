import { query } from '../config/database';
import { BusinessApplication, BusinessDomain, BusinessCriticality, PaginatedResponse } from '../types';

export interface BusinessApplicationFilters {
  business_domain?: BusinessDomain;
  business_criticality?: BusinessCriticality;
  search?: string;
}

export interface CreateBusinessApplicationDTO {
  name: string;
  description: string;
  business_domain: BusinessDomain;
  business_criticality: BusinessCriticality;
  business_owner?: string;
  business_owner_email?: string;
  business_capability?: string;
  strategic_value?: string;
}

export interface UpdateBusinessApplicationDTO extends Partial<CreateBusinessApplicationDTO> {}

export const businessApplicationService = {
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: BusinessApplicationFilters
  ): Promise<PaginatedResponse<BusinessApplication>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.business_domain) {
      whereClause += ` AND business_domain = $${paramIndex++}`;
      params.push(filters.business_domain);
    }
    if (filters?.business_criticality) {
      whereClause += ` AND business_criticality = $${paramIndex++}`;
      params.push(filters.business_criticality);
    }
    if (filters?.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR business_owner ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM business_applications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM business_applications ${whereClause} 
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

  async findById(id: number): Promise<BusinessApplication | null> {
    const result = await query('SELECT * FROM business_applications WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: CreateBusinessApplicationDTO): Promise<BusinessApplication> {
    const result = await query(
      `INSERT INTO business_applications 
       (name, description, business_domain, business_criticality, business_owner, business_owner_email, business_capability, strategic_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.description,
        data.business_domain,
        data.business_criticality,
        data.business_owner,
        data.business_owner_email,
        data.business_capability,
        data.strategic_value
      ]
    );
    return result.rows[0];
  },

  async update(id: number, data: UpdateBusinessApplicationDTO): Promise<BusinessApplication | null> {
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
      `UPDATE business_applications SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM business_applications WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getLinkedApplications(businessApplicationId: number): Promise<any[]> {
    const result = await query(
      `SELECT a.*, baa.notes
       FROM applications a
       JOIN business_application_applications baa ON a.id = baa.application_id
       WHERE baa.business_application_id = $1
       ORDER BY a.name`,
      [businessApplicationId]
    );
    return result.rows;
  },

  async linkApplication(businessApplicationId: number, applicationId: number, notes?: string): Promise<void> {
    await query(
      `INSERT INTO business_application_applications (business_application_id, application_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (business_application_id, application_id) DO UPDATE SET notes = $3`,
      [businessApplicationId, applicationId, notes]
    );
  },

  async unlinkApplication(businessApplicationId: number, applicationId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM business_application_applications 
       WHERE business_application_id = $1 AND application_id = $2`,
      [businessApplicationId, applicationId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getDomains(): Promise<string[]> {
    const result = await query(
      `SELECT DISTINCT business_domain FROM business_applications ORDER BY business_domain`
    );
    return result.rows.map(row => row.business_domain);
  },

  async getCapabilities(): Promise<string[]> {
    const result = await query(
      `SELECT DISTINCT business_capability FROM business_applications 
       WHERE business_capability IS NOT NULL 
       ORDER BY business_capability`
    );
    return result.rows.map(row => row.business_capability);
  }
};
