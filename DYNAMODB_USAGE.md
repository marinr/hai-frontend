# DynamoDB Usage Documentation

## Table of Contents
- [Overview](#overview)
- [Table Design](#table-design)
- [Entity Types](#entity-types)
- [Access Patterns](#access-patterns)
- [Key Structure](#key-structure)
- [Global Secondary Indexes (GSIs)](#global-secondary-indexes-gsis)
- [Repository Layer](#repository-layer)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The HAI (Hotel AI) system uses a **single-table design** in DynamoDB to store all hotel-related data. This approach provides:
- Cost efficiency through a single table
- Flexible querying through Global Secondary Indexes (GSIs)
- Optimal performance for related data access patterns
- Scalability for hotel operations

**Table Name**: `${prefix}-hai-data` (configured via Terraform)  
**Billing Mode**: PAY_PER_REQUEST (on-demand)

## Table Design

### Primary Keys
- **PK** (Partition Key): Entity identifier in format `ENTITY_TYPE#ID`
- **SK** (Sort Key): Always set to `METADATA` for main entity records

### Global Secondary Indexes (GSIs)

The table uses 3 GSIs to support various access patterns:

#### GSI1 - Entity Type Index
- **Purpose**: List all entities of a specific type
- **Keys**: GSI1PK (Partition), GSI1SK (Sort)
- **Projection**: ALL

#### GSI2 - Relationship Index
- **Purpose**: Query entities by their relationships (e.g., messages by reservation, tasks by reservation)
- **Keys**: GSI2PK (Partition), GSI2SK (Sort)
- **Projection**: ALL

#### GSI3 - Property/Date Index
- **Purpose**: Query reservations by property and date range
- **Keys**: GSI3PK (Partition), GSI3SK (Sort)
- **Projection**: ALL

## Entity Types

The system manages six core entity types:

1. **PROPERTY** - Hotel rooms/properties
2. **GUEST** - Guest information
3. **RESERVATION** - Booking details
4. **MESSAGE** - Guest communications
5. **STAFF** - Staff member information
6. **TASK** - Tasks assigned to staff

## Access Patterns

### Property Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get property by ID | `getItem` | Main Table | PK=`PROPERTY#{id}`, SK=`METADATA` |
| List all properties | `query` | GSI1 | GSI1PK=`PROPERTY` |

**Key Structure:**
```
PK: PROPERTY#{uuid}
SK: METADATA
GSI1PK: PROPERTY
GSI1SK: {uuid}
```

### Guest Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get guest by ID | `getItem` | Main Table | PK=`GUEST#{id}`, SK=`METADATA` |
| List all guests | `query` | GSI1 | GSI1PK=`GUEST` |

**Key Structure:**
```
PK: GUEST#{uuid}
SK: METADATA
GSI1PK: GUEST
GSI1SK: {uuid}
```

### Reservation Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get reservation by ID | `getItem` | Main Table | PK=`RESERVATION#{id}`, SK=`METADATA` |
| List all reservations | `query` | GSI1 | GSI1PK=`RESERVATION` |
| Get reservations by check-in date | `query` | GSI1 | GSI1PK=`RESERVATION`, GSI1SK=`{YYYYMMDD}` |
| Get reservations by guest | `query` | GSI2 | GSI2PK=`GUEST#{guest_id}` |
| Get reservation by property & dates | `query` | GSI3 | GSI3PK=`PROPERTY#{room_id}`, GSI3SK=`{checkin}#{checkout}` |

**Key Structure:**
```
PK: RESERVATION#{uuid}
SK: METADATA
GSI1PK: RESERVATION
GSI1SK: {checkin_date_YYYYMMDD}  # For date-based queries
GSI2PK: GUEST#{guest_id}          # For guest's reservations
GSI2SK: RESERVATION#{uuid}
GSI3PK: PROPERTY#{room_id}        # For property availability
GSI3SK: {checkin_YYYYMMDD}#{checkout_YYYYMMDD}
```

**Date Format**: Dates are stored internally as YYYYMMDD but API uses DDMMYYYY format (converted by repositories).

### Message Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get message by ID | `getItem` | Main Table | PK=`MESSAGE#{id}`, SK=`METADATA` |
| List all messages | `query` | GSI1 | GSI1PK=`MESSAGE` |
| Get messages by date | `query` | GSI1 | GSI1PK=`MESSAGE`, GSI1SK=`{YYYYMMDD}` |
| Get messages by reservation | `query` | GSI2 | GSI2PK=`RESERVATION#{reservation_id}` |

**Key Structure:**
```
PK: MESSAGE#{uuid}
SK: METADATA
GSI1PK: MESSAGE
GSI1SK: {date_YYYYMMDD}           # For date-based queries
GSI2PK: RESERVATION#{reservation_id}  # For reservation's messages
GSI2SK: MESSAGE#{uuid}
```

### Staff Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get staff by ID | `getItem` | Main Table | PK=`STAFF#{id}`, SK=`METADATA` |
| List all staff | `query` | GSI1 | GSI1PK=`STAFF` |

**Key Structure:**
```
PK: STAFF#{uuid}
SK: METADATA
GSI1PK: STAFF
GSI1SK: {uuid}
```

### Task Access Patterns

| Pattern | Method | Index | Key Condition |
|---------|--------|-------|---------------|
| Get task by ID | `getItem` | Main Table | PK=`TASK#{id}`, SK=`METADATA` |
| List all tasks | `query` | GSI1 | GSI1PK=`TASK` |
| Get tasks by reservation | `query` | GSI2 | GSI2PK=`RESERVATION#{reservation_id}` |

**Key Structure:**
```
PK: TASK#{uuid}
SK: METADATA
GSI1PK: TASK
GSI1SK: {uuid}
GSI2PK: RESERVATION#{reservation_info_id}  # For reservation's tasks
GSI2SK: TASK#{uuid}
```

## Key Structure

### General Pattern
All entities follow this pattern:
- **PK**: `{ENTITY_TYPE}#{UUID}` - Unique identifier for the entity
- **SK**: `METADATA` - Distinguishes main entity record (allows for future item collections)

### Relationship Keys
Entities use GSI2 to establish relationships:
- Messages belong to Reservations: `GSI2PK: RESERVATION#{reservation_id}`
- Tasks belong to Reservations: `GSI2PK: RESERVATION#{reservation_info_id}`
- Reservations belong to Guests: `GSI2PK: GUEST#{guest_id}`

### Date Keys
Date-based sorting uses GSI1SK with YYYYMMDD format:
- Reservations sorted by check-in: `GSI1SK: {checkin_YYYYMMDD}`
- Messages sorted by date: `GSI1SK: {date_YYYYMMDD}`

## Repository Layer

The system provides repository layers in both TypeScript and Python:

### TypeScript Repositories (Node.js Lambda Layer)

Located in: `backend/lambda-layers/data-repositories/nodejs/repositories/`

**Available Repositories:**
- `guestRepository.ts` - Guest CRUD operations
- `reservationRepository.ts` - Reservation management
- `messageRepository.ts` - Message tracking
- `taskRepository.ts` - Task management
- `staffRepository.ts` - Staff information
- `propertyRepository.ts` - Property/room management

**Core Functions:**
Each repository provides:
- `create{Entity}(data)` - Create new entity
- `get{Entity}ById(id)` - Retrieve by ID
- `update{Entity}(id, data)` - Update entity
- `delete{Entity}(id)` - Delete entity
- `list{Entities}()` - List all entities of type

**DynamoDB Utilities:**
Located in: `backend/lambda-layers/data-repositories/nodejs/utils/dynamodb.ts`

```typescript
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';
```

### Python Repositories (Lambda Layer)

Located in: `backend/lambda-layers/data-repositories/python/repositories/dynamodb_helper.py`

**Available Functions:**
- `create_guest(data)` - Create guest
- `create_reservation(data)` - Create reservation
- `create_message(data)` - Create message
- `create_task(data)` - Create task
- `create_staff(data)` - Create staff
- `create_property(data)` - Create property

**Usage in Python:**
```python
from repositories.dynamodb_helper import create_guest, create_reservation

# Create a guest
guest = create_guest({
    'name': 'John',
    'surname': 'Doe',
    'country': 'USA',
    'city': 'New York',
    'region': 'NY',
    'date_birth': '01011990',
    'language': 'English',
    'nationality': 'American'
})

# Create a reservation
reservation = create_reservation({
    'room_id': 'property-uuid',
    'guest_id': guest['id'],
    'checkin_date': '01012025',
    'checkout_date': '05012025',
    'number_of_guests': 2,
    'origin': 'Direct',
    'origin_confirmation_id': 'CONF-123',
    # ... other fields
})
```

## Usage Examples

### TypeScript/Node.js Examples

#### Creating a Guest
```typescript
import { createGuest } from '/opt/nodejs/repositories/guestRepository';

const guest = await createGuest({
  name: 'Sarah',
  surname: 'Johnson',
  country: 'United Kingdom',
  city: 'London',
  region: 'Greater London',
  date_birth: '15031988',
  language: 'English',
  nationality: 'British'
});
// Returns: Guest object with PK, SK, GSI keys, and metadata
```

#### Getting a Reservation
```typescript
import { getReservationById } from '/opt/nodejs/repositories/reservationRepository';

const reservation = await getReservationById('a1f5d2c3-6e7f-4a1a-9e3b-5b3a8e1d2c4f');
// Returns: Full reservation object or null
```

#### Listing All Properties
```typescript
import { listProperties } from '/opt/nodejs/repositories/propertyRepository';

const properties = await listProperties();
// Returns: Array of all property objects
```

#### Querying Messages by Reservation
```typescript
import { getMessagesByReservationId } from '/opt/nodejs/repositories/messageRepository';

const messages = await getMessagesByReservationId('a1f5d2c3-6e7f-4a1a-9e3b-5b3a8e1d2c4f');
// Returns: Array of messages for that reservation
```

#### Querying Messages by Date
```typescript
import { getMessagesByDate } from '/opt/nodejs/repositories/messageRepository';

const messages = await getMessagesByDate('14042025'); // DDMMYYYY format
// Returns: Array of messages from that date
```

#### Updating a Task
```typescript
import { updateTask } from '/opt/nodejs/repositories/taskRepository';

const updatedTask = await updateTask('task-id', {
  task_resolution_description: 'Task completed successfully',
  task_description: 'Updated description'
});
// Returns: Updated task object
```

#### Getting Tasks by Reservation
```typescript
import { getTasksByReservationId } from '/opt/nodejs/repositories/taskRepository';

const tasks = await getTasksByReservationId('reservation-id');
// Returns: Array of tasks for that reservation
```

### API Handler Example

From `backend/hai-api-lambda/handlers/guests.ts`:

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createGuest,
  getGuestById,
  updateGuest,
  deleteGuest,
  listGuests,
} from '/opt/nodejs/repositories/guestRepository';

export async function handleGuests(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const id = event.pathParameters?.id;

  switch (method) {
    case 'GET':
      if (id) {
        const guest = await getGuestById(id);
        return jsonResponse(200, guest);
      }
      const guests = await listGuests();
      return jsonResponse(200, guests);
    
    case 'POST':
      const newGuest = await createGuest(JSON.parse(event.body));
      return jsonResponse(201, newGuest);
    
    case 'PUT':
      const updatedGuest = await updateGuest(id, JSON.parse(event.body));
      return jsonResponse(200, updatedGuest);
    
    case 'DELETE':
      await deleteGuest(id);
      return noContentResponse(204);
  }
}
```

## Best Practices

### 1. Single Table Design Benefits
- **All entities in one table** - Reduces costs and complexity
- **GSI for access patterns** - Support multiple query patterns efficiently
- **Relationship modeling** - Use GSI2PK/SK for parent-child relationships

### 2. Key Design Patterns
- **Composite PK**: Use `ENTITY_TYPE#ID` format for easy identification
- **Fixed SK**: Use `METADATA` as SK for main entity records
- **Date formatting**: Store dates as YYYYMMDD for proper sorting
- **UUID generation**: Use uuid v4 for unique identifiers

### 3. GSI Usage Guidelines

**GSI1 - Type Listing**
- Query all entities of a type
- Sort by date when GSI1SK contains YYYYMMDD
- Example: List all reservations sorted by check-in date

**GSI2 - Relationships**
- Model parent-child relationships
- Example: Get all messages for a reservation
- Pattern: `GSI2PK: PARENT_TYPE#parent_id`, `GSI2SK: CHILD_TYPE#child_id`

**GSI3 - Complex Queries**
- Special use cases like date range queries
- Example: Check room availability for specific dates
- Pattern: `GSI3PK: PROPERTY#room_id`, `GSI3SK: checkin#checkout`

### 4. Update Best Practices
- Always update `updatedAt` timestamp
- Use `UpdateExpression` for partial updates (more efficient than full item replacement)
- Update GSI keys when relationship fields change
- Use `ExpressionAttributeNames` to handle reserved keywords

### 5. Date Handling
- **API Format**: DDMMYYYY (user-friendly)
- **Storage Format**: YYYYMMDD (sortable)
- Use `ddmmyyyyToYyyymmdd()` helper for conversion
- Store times in ISO 8601 format for timestamps

### 6. Error Handling
```typescript
try {
  const item = await getItemById(id);
  if (!item) {
    return errorResponse(404, 'Item not found');
  }
  return jsonResponse(200, item);
} catch (error) {
  console.error('DynamoDB error:', error);
  return errorResponse(500, 'Internal server error');
}
```

### 7. Query Optimization
- Use `query` instead of `scan` whenever possible
- Specify `Limit` for large result sets
- Use `begins_with` for prefix matching on sort keys
- Project only needed attributes when not using `ALL`

### 8. Consistent Field Naming
All entities include:
- `id`: String UUID
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp
- Entity-specific fields in snake_case

### 9. Lambda Layer Usage
- Import from `/opt/nodejs/repositories/` in Lambda functions
- Set `DYNAMODB_TABLE_NAME` environment variable
- Layer provides TypeScript types and utilities

### 10. Testing with Sample Data
- Use `backend/hai-api-lambda/sample-dynamodb-items.json` for testing
- Load sample data with `backend/hai-api-lambda/load-sample-dynamodb.js`
- Verify key structure matches patterns documented above

## Infrastructure

The DynamoDB table is provisioned using Terraform:

**File**: `infra/dynamodb.tf`

```hcl
resource "aws_dynamodb_table" "hai_data" {
  name         = "${local.normalized_prefix}-hai-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"
  
  # Define attributes (only for keys)
  attribute { name = "PK", type = "S" }
  attribute { name = "SK", type = "S" }
  attribute { name = "GSI1PK", type = "S" }
  attribute { name = "GSI1SK", type = "S" }
  attribute { name = "GSI2PK", type = "S" }
  attribute { name = "GSI2SK", type = "S" }
  attribute { name = "GSI3PK", type = "S" }
  attribute { name = "GSI3SK", type = "S" }

  # GSIs
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }
}
```

## Summary

The HAI system leverages DynamoDB's single-table design pattern to efficiently store and query hotel operations data. The design provides:

✅ **Efficient queries** through strategic use of GSIs  
✅ **Cost optimization** with a single table and on-demand billing  
✅ **Flexible relationships** between entities  
✅ **Type-safe operations** through TypeScript repositories  
✅ **Cross-language support** with both Node.js and Python layers  
✅ **Scalable architecture** supporting hotel operations at any scale

For more information, see:
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
