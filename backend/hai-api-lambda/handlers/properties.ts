import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  listProperties,
  searchPropertiesByDateRange,
} from '../repositories/propertyRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { isValidDdmmyyyy } from '../utils/dateUtils';

export async function handleProperties(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          // GET /properties/{id}
          const property = await getPropertyById(id);
          if (!property) {
            return errorResponse(404, 'Property not found');
          }
          return jsonResponse(200, property);
        } else {
          // GET /properties?from=DDMMYYYY&to=DDMMYYYY
          const from = queryParams.from;
          const to = queryParams.to;

          if (from && to) {
            // Validate date formats
            if (!isValidDdmmyyyy(from)) {
              return errorResponse(400, 'Invalid "from" date format. Expected DDMMYYYY');
            }
            if (!isValidDdmmyyyy(to)) {
              return errorResponse(400, 'Invalid "to" date format. Expected DDMMYYYY');
            }

            const properties = await searchPropertiesByDateRange(from, to);
            return jsonResponse(200, properties);
          } else {
            // List all properties
            const properties = await listProperties();
            return jsonResponse(200, properties);
          }
        }

      case 'POST':
        // POST /properties
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }

        const createData = JSON.parse(event.body);
        
        // Validate required fields
        const requiredFields = ['room_number', 'room_name', 'floor', 'room_count'];
        for (const field of requiredFields) {
          if (createData[field] === undefined) {
            return errorResponse(400, `Missing required field: ${field}`);
          }
        }

        const newProperty = await createProperty(createData);
        return jsonResponse(201, newProperty);

      case 'PUT':
        // PUT /properties/{id}
        if (!id) {
          return errorResponse(400, 'Property ID is required');
        }

        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }

        const updateData = JSON.parse(event.body);
        const updatedProperty = await updateProperty(id, updateData);
        return jsonResponse(200, updatedProperty);

      case 'DELETE':
        // DELETE /properties/{id}
        if (!id) {
          return errorResponse(400, 'Property ID is required');
        }

        await deleteProperty(id);
        return jsonResponse(204, null);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in properties handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
