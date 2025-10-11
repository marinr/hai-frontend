import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  listStaff,
} from '../repositories/staffRepository';
import { jsonResponse, errorResponse, noContentResponse } from '../utils/response';

export async function handleStaff(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const staff = await getStaffById(id);
          if (!staff) {
            return errorResponse(404, 'Staff member not found');
          }
          return jsonResponse(200, staff);
        } else {
          const staffList = await listStaff();
          return jsonResponse(200, staffList);
        }

      case 'POST':
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const createData = JSON.parse(event.body);
        const newStaff = await createStaff(createData);
        return jsonResponse(201, newStaff);

      case 'PUT':
        if (!id) {
          return errorResponse(400, 'Staff ID is required');
        }
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const updateData = JSON.parse(event.body);
        const updatedStaff = await updateStaff(id, updateData);
        return jsonResponse(200, updatedStaff);

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Staff ID is required');
        }
        await deleteStaff(id);
        return noContentResponse(204);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in staff handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
