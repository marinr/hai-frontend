import type { Handler } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { demoBookings, demoListings } from './mock-data/demoReservations';
import { getDashboard } from './mock-data/homeDashboard';
import {
  getStaffDashboardData,
  RESERVATION_TASKS,
  STAFF_MEMBERS,
} from './mock-data/staffAssignments';

// Lambda Function URL event/response types
interface FunctionUrlEvent {
  version: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
}

interface FunctionUrlResult {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

const baseHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
};

const jsonResponse = (statusCode: number, payload: unknown): FunctionUrlResult => ({
  statusCode,
  headers: {
    ...baseHeaders,
    'content-type': 'application/json',
  },
  body: JSON.stringify(payload),
});

// Token verification
const verifyToken = async (
  event: FunctionUrlEvent
): Promise<{ isValid: boolean; error?: string; userId?: string }> => {
  try {
    // Get User Pool ID from CloudFront custom header
    const userPoolId = event.headers['x-user-pool-id'];
    const clientId = event.headers['x-user-pool-client-id'];

    if (!userPoolId || !clientId) {
      return { isValid: false, error: 'Missing authentication configuration' };
    }

    // Extract token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return { isValid: false, error: 'Missing authorization header' };
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return { isValid: false, error: 'Invalid authorization header format' };
    }

    // Create verifier (cached across invocations)
    const verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId,
    });

    // Verify the token
    const payload = await verifier.verify(token);
    
    return { isValid: true, userId: payload.sub };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { isValid: false, error: 'Invalid or expired token' };
  }
};

const noContentResponse = (statusCode: number): FunctionUrlResult => ({
  statusCode,
  headers: baseHeaders,
  body: '',
});

const parseBaseDate = (event: FunctionUrlEvent): Date => {
  const baseDate = event.queryStringParameters?.baseDate;
  if (!baseDate) {
    return new Date();
  }

  const parsed = new Date(baseDate);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const resolvePath = (event: FunctionUrlEvent): string => {
  const path = event.rawPath ?? event.requestContext.http.path ?? '/';
  if (path.startsWith('/api/')) {
    return path;
  }

  if (path === '/api') {
    return '/api';
  }

  if (path.startsWith('/')) {
    return `/api${path}`;
  }

  return `/api/${path}`;
};

export const handler = async (event: FunctionUrlEvent): Promise<FunctionUrlResult> => {
  const method = event.requestContext.http.method;

  if (method === 'OPTIONS') {
    return noContentResponse(204);
  }

  // Verify authentication for all requests except OPTIONS and HEAD
  if (method !== 'HEAD') {
    const authResult = await verifyToken(event);
    if (!authResult.isValid) {
      return jsonResponse(401, {
        message: 'Unauthorized',
        error: authResult.error,
      });
    }
    // Token is valid, user ID available in authResult.userId if needed
  }

  if (method === 'HEAD') {
    // Treat HEAD like GET but omit body; CloudFront may probe with HEAD.
    const path = resolvePath(event);

    switch (path) {
      case '/api/dashboard':
      case '/api/staff/assignments':
      case '/api/staff/tasks':
      case '/api/staff/members':
      case '/api/listings':
      case '/api/bookings':
        return noContentResponse(204);
      default:
        return noContentResponse(404);
    }
  }

  if (method !== 'GET') {
    return jsonResponse(405, { message: 'Method Not Allowed' });
  }

  switch (resolvePath(event)) {
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
