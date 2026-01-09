"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
exports.getStaffById = getStaffById;
exports.updateStaff = updateStaff;
exports.deleteStaff = deleteStaff;
exports.listStaff = listStaff;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const ENTITY_TYPE = 'STAFF';
/**
 * Create a new staff member
 */
async function createStaff(data) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const staff = {
        PK: `${ENTITY_TYPE}#${id}`,
        SK: 'METADATA',
        GSI1PK: ENTITY_TYPE,
        GSI1SK: id,
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    await (0, dynamodb_1.putItem)(staff);
    return staff;
}
/**
 * Get a staff member by ID
 */
async function getStaffById(id) {
    const item = await (0, dynamodb_1.getItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
    return item || null;
}
/**
 * Update a staff member
 */
async function updateStaff(id, data) {
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
    updateExpressions.push(`#updatedAt = :updatedAt`);
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    const updateExpression = `SET ${updateExpressions.join(', ')}`;
    const updated = await (0, dynamodb_1.updateItem)(`${ENTITY_TYPE}#${id}`, 'METADATA', updateExpression, expressionAttributeNames, expressionAttributeValues);
    return updated;
}
/**
 * Delete a staff member
 */
async function deleteStaff(id) {
    await (0, dynamodb_1.deleteItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
}
/**
 * List all staff members
 */
async function listStaff() {
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': ENTITY_TYPE,
        },
    });
    return items;
}
//# sourceMappingURL=staffRepository.js.map