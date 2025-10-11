import { v4 as uuidv4 } from 'uuid';
import { Staff, CreateStaffRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';

const ENTITY_TYPE = 'STAFF';

/**
 * Create a new staff member
 */
export async function createStaff(data: CreateStaffRequest): Promise<Staff> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const staff: Staff = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: id,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(staff);
  return staff;
}

/**
 * Get a staff member by ID
 */
export async function getStaffById(id: string): Promise<Staff | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a staff member
 */
export async function updateStaff(id: string, data: Partial<CreateStaffRequest>): Promise<Staff> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let index = 0;
  for (const [key, value] of Object.entries(data)) {
    updateExpressions.push(`#attr${index} = :val${index}`);
    expressionAttributeNames[`#attr${index}`] = key;
    expressionAttributeValues[`:val${index}`] = value;
    index++;
  }

  updateExpressions.push(`#updatedAt = :updatedAt`);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const updateExpression = `SET ${updateExpressions.join(', ')}`;

  const updated = await updateItem(
    `${ENTITY_TYPE}#${id}`,
    'METADATA',
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues
  );

  return updated as Staff;
}

/**
 * Delete a staff member
 */
export async function deleteStaff(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all staff members
 */
export async function listStaff(): Promise<Staff[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Staff[];
}
