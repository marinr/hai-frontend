import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
export declare const docClient: DynamoDBDocumentClient;
export declare const TABLE_NAME: string;
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
export declare function getItem(pk: string, sk: string): Promise<any>;
/**
 * Put an item into DynamoDB
 */
export declare function putItem(item: any): Promise<void>;
/**
 * Update an item in DynamoDB
 */
export declare function updateItem(pk: string, sk: string, updateExpression: string, expressionAttributeNames: Record<string, string>, expressionAttributeValues: Record<string, any>): Promise<any>;
/**
 * Delete an item from DynamoDB
 */
export declare function deleteItem(pk: string, sk: string): Promise<void>;
/**
 * Query items from DynamoDB
 */
export declare function queryItems(params: QueryParams): Promise<any[]>;
/**
 * Scan items from DynamoDB (use sparingly)
 */
export declare function scanItems(filterExpression?: string, expressionAttributeNames?: Record<string, string>, expressionAttributeValues?: Record<string, any>): Promise<any[]>;
