import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { demoBookings, demoListings } from './mock-data/demoReservations';
import { getDashboard } from './mock-data/homeDashboard';
import {
  getStaffDashboardData,
  RESERVATION_TASKS,
  STAFF_MEMBERS,
} from './mock-data/staffAssignments';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
};

const jsonResponse = (statusCode: number, payload: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    ...baseHeaders,
    'content-type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const noContentResponse = (statusCode: number): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: baseHeaders,
  body: '',
});

const parseBaseDate = (event: APIGatewayProxyEventV2): Date => {
  const baseDate = event.queryStringParameters?.baseDate;
  if (!baseDate) {
    return new Date();
  }

  const parsed = new Date(baseDate);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // HTTP API v2 format
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  // Handle OPTIONS for CORS
  if (method === 'OPTIONS') {
    return noContentResponse(204);
  }

  // API Gateway Cognito authorizer handles JWT verification
  // The Lambda receives the request only if the token is valid
  // User info is available in event.requestContext.authorizer if needed

  if (method !== 'GET' && method !== 'HEAD') {
    return jsonResponse(405, { message: 'Method Not Allowed' });
  }

  if (method === 'HEAD') {
    return noContentResponse(200);
  }

  switch (path) {
    case '/api/dashboard':
      return jsonResponse(200, getDashboard());
    case '/api/staff/assignments':
      return jsonResponse(200, getStaffDashboardData(parseBaseDate(event)));
    case '/api/staff/tasks':
      return jsonResponse(200, RESERVATION_TASKS);
    case '/api/staff/members':
      return jsonResponse(200, STAFF_MEMBERS);
    case '/api/listings':
      return jsonResponse(200, demoListings);
    case '/api/bookings':
      return jsonResponse(200, demoBookings);
    default:
      return jsonResponse(404, { message: 'Not Found' });
  }
};