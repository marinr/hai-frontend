import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || '';

export interface QueryParams {
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  IndexName?: string;
  FilterExpression?: string;
  Limit?: number;
  ScanIndexForward?: boolean;
}

/**
 * Get an item from DynamoDB
 */
export async function getItem(pk: string, sk: string): Promise<any> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Put an item into DynamoDB
 */
export async function putItem(item: any): Promise<void> {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await docClient.send(command);
}

/**
 * Update an item in DynamoDB
 */
export async function updateItem(
  pk: string,
  sk: string,
  updateExpression: string,
  expressionAttributeNames: Record<string, string>,
  expressionAttributeValues: Record<string, any>
): Promise<any> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes;
}

/**
 * Delete an item from DynamoDB
 */
export async function deleteItem(pk: string, sk: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  });

  await docClient.send(command);
}

/**
 * Query items from DynamoDB
 */
export async function queryItems(params: QueryParams): Promise<any[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    ...params,
  });

  const response = await docClient.send(command);
  return response.Items || [];
}

/**
 * Scan items from DynamoDB (use sparingly)
 */
export async function scanItems(filterExpression?: string, expressionAttributeNames?: Record<string, string>, expressionAttributeValues?: Record<string, any>): Promise<any[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: filterExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  const response = await docClient.send(command);
  return response.Items || [];
}
