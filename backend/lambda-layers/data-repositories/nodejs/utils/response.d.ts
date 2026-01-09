import type { APIGatewayProxyResultV2 } from 'aws-lambda';
export declare function jsonResponse(statusCode: number, payload: unknown): APIGatewayProxyResultV2;
export declare function noContentResponse(statusCode: number): APIGatewayProxyResultV2;
export declare function errorResponse(statusCode: number, message: string): APIGatewayProxyResultV2;
//# sourceMappingURL=response.d.ts.map