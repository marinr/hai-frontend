"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_NAME = exports.docClient = void 0;
exports.getItem = getItem;
exports.putItem = putItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.queryItems = queryItems;
exports.scanItems = scanItems;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
exports.TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || '';
/**
 * Get an item from DynamoDB
 */
async function getItem(pk, sk) {
    const command = new lib_dynamodb_1.GetCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    });
    const response = await exports.docClient.send(command);
    return response.Item;
}
/**
 * Put an item into DynamoDB
 */
async function putItem(item) {
    const command = new lib_dynamodb_1.PutCommand({
        TableName: exports.TABLE_NAME,
        Item: item,
    });
    await exports.docClient.send(command);
}
/**
 * Update an item in DynamoDB
 */
async function updateItem(pk, sk, updateExpression, expressionAttributeNames, expressionAttributeValues) {
    const command = new lib_dynamodb_1.UpdateCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    });
    const response = await exports.docClient.send(command);
    return response.Attributes;
}
/**
 * Delete an item from DynamoDB
 */
async function deleteItem(pk, sk) {
    const command = new lib_dynamodb_1.DeleteCommand({
        TableName: exports.TABLE_NAME,
        Key: { PK: pk, SK: sk },
    });
    await exports.docClient.send(command);
}
/**
 * Query items from DynamoDB
 */
async function queryItems(params) {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: exports.TABLE_NAME,
        ...params,
    });
    const response = await exports.docClient.send(command);
    return response.Items || [];
}
/**
 * Scan items from DynamoDB (use sparingly)
 */
async function scanItems(filterExpression, expressionAttributeNames, expressionAttributeValues) {
    const command = new lib_dynamodb_1.ScanCommand({
        TableName: exports.TABLE_NAME,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });
    const response = await exports.docClient.send(command);
    return response.Items || [];
}
//# sourceMappingURL=dynamodb.js.map