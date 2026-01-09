"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProperty = createProperty;
exports.getPropertyById = getPropertyById;
exports.updateProperty = updateProperty;
exports.deleteProperty = deleteProperty;
exports.listProperties = listProperties;
exports.searchPropertiesByDateRange = searchPropertiesByDateRange;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const ENTITY_TYPE = 'PROPERTY';
/**
 * Create a new property
 */
async function createProperty(data) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const property = {
        PK: `${ENTITY_TYPE}#${id}`,
        SK: 'METADATA',
        GSI1PK: ENTITY_TYPE,
        GSI1SK: id,
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    await (0, dynamodb_1.putItem)(property);
    return property;
}
/**
 * Get a property by ID
 */
async function getPropertyById(id) {
    const item = await (0, dynamodb_1.getItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
    return item || null;
}
/**
 * Update a property
 */
async function updateProperty(id, data) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
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
    const updated = await (0, dynamodb_1.updateItem)(`${ENTITY_TYPE}#${id}`, 'METADATA', updateExpression, expressionAttributeNames, expressionAttributeValues);
    return updated;
}
/**
 * Delete a property
 */
async function deleteProperty(id) {
    await (0, dynamodb_1.deleteItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
}
/**
 * List all properties
 */
async function listProperties() {
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': ENTITY_TYPE,
        },
    });
    return items;
}
/**
 * Search properties by date range
 * This checks if properties are available during the specified date range
 */
async function searchPropertiesByDateRange(fromDdmmyyyy, toDdmmyyyy) {
    // For now, return all properties
    // In a production system, you would query reservations to check availability
    const allProperties = await listProperties();
    // TODO: Filter out properties that have conflicting reservations
    // This would require querying the reservations for each property
    // and checking if any reservation overlaps with the requested date range
    return allProperties;
}
//# sourceMappingURL=propertyRepository.js.map