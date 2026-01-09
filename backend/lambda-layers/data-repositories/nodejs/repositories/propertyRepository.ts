import { v4 as uuidv4 } from 'uuid';
import { Property, CreatePropertyRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems, scanItems } from '../utils/dynamodb';
import { ddmmyyyyToYyyymmdd, yyyymmddToDdmmyyyy } from '../utils/dateUtils';

const ENTITY_TYPE = 'PROPERTY';

/**
 * Create a new property
 */
export async function createProperty(data: CreatePropertyRequest): Promise<Property> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const property: Property = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: id,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(property);
  return property;
}

/**
 * Get a property by ID
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a property
 */
export async function updateProperty(id: string, data: Partial<CreatePropertyRequest>): Promise<Property> {
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

  // Always update updatedAt
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

  return updated as Property;
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all properties
 */
export async function listProperties(): Promise<Property[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Property[];
}

/**
 * Search properties by date range
 * This checks if properties are available during the specified date range
 */
export async function searchPropertiesByDateRange(fromDdmmyyyy: string, toDdmmyyyy: string): Promise<Property[]> {
  // For now, return all properties
  // In a production system, you would query reservations to check availability
  const allProperties = await listProperties();
  
  // TODO: Filter out properties that have conflicting reservations
  // This would require querying the reservations for each property
  // and checking if any reservation overlaps with the requested date range
  
  return allProperties;
}
