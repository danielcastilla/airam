import { query } from '../config/database';
import { ApiError } from '../middleware/errorHandler';

// Types
export type EntityType = 'BUSINESS_APPLICATION' | 'APPLICATION' | 'TECHNOLOGY' | 'INTERFACE' | 'DEPENDENCY';
export type FieldType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'SELECT' | 'TEXTAREA' | 'URL' | 'EMAIL';

export interface CustomAttributeSection {
  id: number;
  entity_type: EntityType;
  name: string;
  description?: string;
  display_order: number;
  is_collapsed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomAttributeDefinition {
  id: number;
  entity_type: EntityType;
  section_id?: number;
  section_name?: string;
  name: string;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
  validation_rules?: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomAttributeValue {
  id: number;
  attribute_id: number;
  entity_type: EntityType;
  entity_id: number;
  value_string?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_date?: string;
  value_json?: any;
}

// Section DTOs
export interface CreateSectionDTO {
  entity_type: EntityType;
  name: string;
  description?: string;
  display_order?: number;
  is_collapsed?: boolean;
}

export interface UpdateSectionDTO {
  name?: string;
  description?: string;
  display_order?: number;
  is_collapsed?: boolean;
}

// Definition DTOs
export interface CreateDefinitionDTO {
  entity_type: EntityType;
  section_id?: number;
  name: string;
  label: string;
  field_type: FieldType;
  is_required?: boolean;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
  validation_rules?: Record<string, any>;
  display_order?: number;
}

export interface UpdateDefinitionDTO {
  section_id?: number | null;
  name?: string;
  label?: string;
  field_type?: FieldType;
  is_required?: boolean;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
  validation_rules?: Record<string, any>;
  display_order?: number;
  is_active?: boolean;
}

export const customAttributeService = {
  // ============================================
  // SECTIONS
  // ============================================

  async getSections(entityType?: EntityType): Promise<CustomAttributeSection[]> {
    let sql = 'SELECT * FROM custom_attribute_sections';
    const params: any[] = [];

    if (entityType) {
      sql += ' WHERE entity_type = $1';
      params.push(entityType);
    }

    sql += ' ORDER BY entity_type, display_order, name';
    const result = await query(sql, params);
    return result.rows;
  },

  async getSectionById(id: number): Promise<CustomAttributeSection | null> {
    const result = await query('SELECT * FROM custom_attribute_sections WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async createSection(data: CreateSectionDTO): Promise<CustomAttributeSection> {
    // Get max display_order for this entity type
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM custom_attribute_sections WHERE entity_type = $1',
      [data.entity_type]
    );
    const displayOrder = data.display_order ?? maxOrderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO custom_attribute_sections (entity_type, name, description, display_order, is_collapsed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.entity_type, data.name, data.description, displayOrder, data.is_collapsed ?? false]
    );
    return result.rows[0];
  },

  async updateSection(id: number, data: UpdateSectionDTO): Promise<CustomAttributeSection> {
    const section = await this.getSectionById(id);
    if (!section) {
      throw new ApiError('Section not found', 404);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }
    if (data.is_collapsed !== undefined) {
      updates.push(`is_collapsed = $${paramCount++}`);
      values.push(data.is_collapsed);
    }

    if (updates.length === 0) {
      return section;
    }

    values.push(id);
    const result = await query(
      `UPDATE custom_attribute_sections SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteSection(id: number): Promise<void> {
    const section = await this.getSectionById(id);
    if (!section) {
      throw new ApiError('Section not found', 404);
    }

    // Remove section_id from attributes in this section (don't delete the attributes)
    await query('UPDATE custom_attribute_definitions SET section_id = NULL WHERE section_id = $1', [id]);
    await query('DELETE FROM custom_attribute_sections WHERE id = $1', [id]);
  },

  async reorderSections(entityType: EntityType, orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await query(
        'UPDATE custom_attribute_sections SET display_order = $1 WHERE id = $2 AND entity_type = $3',
        [i, orderedIds[i], entityType]
      );
    }
  },

  // ============================================
  // DEFINITIONS
  // ============================================

  async getDefinitions(entityType?: EntityType, includeInactive = false): Promise<CustomAttributeDefinition[]> {
    let sql = `
      SELECT d.*, s.name as section_name
      FROM custom_attribute_definitions d
      LEFT JOIN custom_attribute_sections s ON d.section_id = s.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (entityType) {
      conditions.push(`d.entity_type = $${params.length + 1}`);
      params.push(entityType);
    }

    if (!includeInactive) {
      conditions.push('d.is_active = true');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY d.entity_type, COALESCE(s.display_order, 999), d.display_order, d.label';
    const result = await query(sql, params);
    return result.rows;
  },

  async getDefinitionById(id: number): Promise<CustomAttributeDefinition | null> {
    const result = await query(
      `SELECT d.*, s.name as section_name
       FROM custom_attribute_definitions d
       LEFT JOIN custom_attribute_sections s ON d.section_id = s.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async createDefinition(data: CreateDefinitionDTO): Promise<CustomAttributeDefinition> {
    // Validate section belongs to same entity type
    if (data.section_id) {
      const section = await this.getSectionById(data.section_id);
      if (!section || section.entity_type !== data.entity_type) {
        throw new ApiError('Section not found or belongs to different entity type', 400);
      }
    }

    // Get max display_order
    const maxOrderResult = await query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order 
       FROM custom_attribute_definitions 
       WHERE entity_type = $1 AND (section_id = $2 OR ($2 IS NULL AND section_id IS NULL))`,
      [data.entity_type, data.section_id]
    );
    const displayOrder = data.display_order ?? maxOrderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO custom_attribute_definitions 
       (entity_type, section_id, name, label, field_type, is_required, default_value, placeholder, help_text, options, validation_rules, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.entity_type,
        data.section_id,
        data.name,
        data.label,
        data.field_type,
        data.is_required ?? false,
        data.default_value,
        data.placeholder,
        data.help_text,
        data.options ? JSON.stringify(data.options) : null,
        data.validation_rules ? JSON.stringify(data.validation_rules) : null,
        displayOrder
      ]
    );
    return result.rows[0];
  },

  async updateDefinition(id: number, data: UpdateDefinitionDTO): Promise<CustomAttributeDefinition> {
    const definition = await this.getDefinitionById(id);
    if (!definition) {
      throw new ApiError('Attribute definition not found', 404);
    }

    // Validate section if changing it
    if (data.section_id !== undefined && data.section_id !== null) {
      const section = await this.getSectionById(data.section_id);
      if (!section || section.entity_type !== definition.entity_type) {
        throw new ApiError('Section not found or belongs to different entity type', 400);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const fields: (keyof UpdateDefinitionDTO)[] = [
      'section_id', 'name', 'label', 'field_type', 'is_required',
      'default_value', 'placeholder', 'help_text', 'display_order', 'is_active'
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    if (data.options !== undefined) {
      updates.push(`options = $${paramCount++}`);
      values.push(data.options ? JSON.stringify(data.options) : null);
    }

    if (data.validation_rules !== undefined) {
      updates.push(`validation_rules = $${paramCount++}`);
      values.push(data.validation_rules ? JSON.stringify(data.validation_rules) : null);
    }

    if (updates.length === 0) {
      return definition;
    }

    values.push(id);
    const result = await query(
      `UPDATE custom_attribute_definitions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteDefinition(id: number): Promise<void> {
    const definition = await this.getDefinitionById(id);
    if (!definition) {
      throw new ApiError('Attribute definition not found', 404);
    }

    // Delete all values for this attribute first
    await query('DELETE FROM custom_attribute_values WHERE attribute_id = $1', [id]);
    await query('DELETE FROM custom_attribute_definitions WHERE id = $1', [id]);
  },

  async reorderDefinitions(sectionId: number | null, orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      if (sectionId === null) {
        await query(
          'UPDATE custom_attribute_definitions SET display_order = $1 WHERE id = $2 AND section_id IS NULL',
          [i, orderedIds[i]]
        );
      } else {
        await query(
          'UPDATE custom_attribute_definitions SET display_order = $1 WHERE id = $2 AND section_id = $3',
          [i, orderedIds[i], sectionId]
        );
      }
    }
  },

  // ============================================
  // VALUES
  // ============================================

  async getValues(entityType: EntityType, entityId: number): Promise<Record<string, any>> {
    const result = await query(
      `SELECT cav.*, cad.name, cad.field_type
       FROM custom_attribute_values cav
       JOIN custom_attribute_definitions cad ON cav.attribute_id = cad.id
       WHERE cav.entity_type = $1 AND cav.entity_id = $2 AND cad.is_active = true`,
      [entityType, entityId]
    );

    const values: Record<string, any> = {};
    for (const row of result.rows) {
      switch (row.field_type) {
        case 'NUMBER':
          values[row.name] = row.value_number;
          break;
        case 'BOOLEAN':
          values[row.name] = row.value_boolean;
          break;
        case 'DATE':
          values[row.name] = row.value_date;
          break;
        case 'SELECT':
          values[row.name] = row.value_json || row.value_string;
          break;
        default:
          values[row.name] = row.value_string;
      }
    }
    return values;
  },

  async setValues(entityType: EntityType, entityId: number, values: Record<string, any>): Promise<void> {
    // Get all active definitions for this entity type
    const definitions = await this.getDefinitions(entityType);
    const defMap = new Map(definitions.map(d => [d.name, d]));

    for (const [name, value] of Object.entries(values)) {
      const def = defMap.get(name);
      if (!def) continue;

      // Prepare value columns based on field type
      let valueString = null;
      let valueNumber = null;
      let valueBoolean = null;
      let valueDate = null;
      let valueJson = null;

      if (value !== null && value !== undefined && value !== '') {
        switch (def.field_type) {
          case 'NUMBER':
            valueNumber = parseFloat(value);
            break;
          case 'BOOLEAN':
            valueBoolean = Boolean(value);
            break;
          case 'DATE':
            valueDate = value;
            break;
          case 'SELECT':
            if (typeof value === 'object') {
              valueJson = JSON.stringify(value);
            } else {
              valueString = value;
            }
            break;
          default:
            valueString = String(value);
        }
      }

      // Upsert the value
      await query(
        `INSERT INTO custom_attribute_values (attribute_id, entity_type, entity_id, value_string, value_number, value_boolean, value_date, value_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (attribute_id, entity_type, entity_id) 
         DO UPDATE SET value_string = $4, value_number = $5, value_boolean = $6, value_date = $7, value_json = $8`,
        [def.id, entityType, entityId, valueString, valueNumber, valueBoolean, valueDate, valueJson]
      );
    }
  },

  async deleteValues(entityType: EntityType, entityId: number): Promise<void> {
    await query(
      'DELETE FROM custom_attribute_values WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
  },

  // ============================================
  // TEMPLATE (Full schema for entity type)
  // ============================================

  async getTemplate(entityType: EntityType): Promise<{
    sections: CustomAttributeSection[];
    attributes: CustomAttributeDefinition[];
  }> {
    const [sections, attributes] = await Promise.all([
      this.getSections(entityType),
      this.getDefinitions(entityType, true)
    ]);

    return { sections, attributes };
  }
};
