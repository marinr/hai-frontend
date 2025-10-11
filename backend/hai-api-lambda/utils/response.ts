import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function jsonResponse(statusCode: number, payload: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      ...baseHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
}

export function noContentResponse(statusCode: number): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: baseHeaders,
    body: '',
  };
}

export function errorResponse(statusCode: number, message: string): APIGatewayProxyResultV2 {
  return jsonResponse(statusCode, { error: message });
}
