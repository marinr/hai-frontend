# Data Repositories Lambda Layer

This Lambda layer provides shared data access logic for both TypeScript and Python Lambda functions in the HAI system.

## Overview

The data repositories have been extracted into Lambda layers to:
- **Reduce code duplication** across Lambda functions
- **Simplify maintenance** by centralizing data access logic
- **Reduce deployment package sizes** for individual Lambda functions
- **Enable consistent data access patterns** across different runtimes

## Structure

```
backend/lambda-layers/data-repositories/
├── nodejs/                      # TypeScript/Node.js layer
│   ├── package.json            # Dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── types.ts                # Type definitions
│   ├── repositories/           # Repository implementations
│   │   ├── guestRepository.ts
│   │   ├── reservationRepository.ts
│   │   ├── messageRepository.ts
│   │   ├── taskRepository.ts
│   │   ├── staffRepository.ts
│   │   └── propertyRepository.ts
│   └── utils/                  # Utility functions
│       ├── dynamodb.ts         # DynamoDB helpers
│       ├── dateUtils.ts        # Date utilities
│       └── response.ts         # Response helpers
│
└── python/                      # Python layer
    └── repositories/            # Repository implementations
        ├── __init__.py
        └── dynamodb_helper.py  # DynamoDB helper functions
```

## Usage

### TypeScript (hai-api-lambda)

The TypeScript layer is used by the HAI API Lambda function. Import repositories as usual:

```typescript
import { createGuest, getGuestById } from '/opt/nodejs/repositories/guestRepository';
import { createReservation, listReservations } from '/opt/nodejs/repositories/reservationRepository';
```

### Python (multi-agentic-data-processor)

The Python layer is used by the multi-agentic data processor. Import the helper functions:

```python
from repositories.dynamodb_helper import (
    create_guest,
    create_reservation,
    create_message,
    create_task
)

# Create a new guest
guest = create_guest({
    'name': 'John',
    'surname': 'Doe',
    'email': 'john@example.com',
    # ... other fields
})

# Create a reservation
reservation = create_reservation({
    'guest_id': guest['id'],
    'room_id': 'room-123',
    'checkin_date': '01012024',  # DDMMYYYY format
    'checkout_date': '05012024',
    # ... other fields
})
```

## Deployment

The Lambda layers are automatically built and deployed via Terraform:

1. **TypeScript Layer Build**: 
   - Runs `npm install` and `npm run build`
   - Compiles TypeScript to JavaScript
   - Packages with node_modules
   - Creates layer at `/opt/nodejs/`

2. **Python Layer Build**:
   - Packages Python modules
   - Creates layer at `/opt/python/`

## Lambda Functions Using These Layers

### hai-api-lambda (Node.js)
- **Layer**: `data-repositories-nodejs`
- **Purpose**: REST API for HAI system
- **Access**: Full CRUD operations on all entities

### multi-agentic-data-processor (Python)
- **Layer**: `data-repositories-python`
- **Purpose**: Process AI-generated structured data
- **Access**: Write operations to persist extracted data

## Environment Variables

Both layers expect the following environment variable:

- `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table

This is automatically set by Terraform when the Lambda functions are deployed.

## Development

### Adding New Repositories

#### TypeScript
1. Create new repository file in `nodejs/repositories/`
2. Follow the pattern of existing repositories
3. Export functions for CRUD operations
4. Update `nodejs/package.json` if new dependencies are needed

#### Python
1. Add new functions to `python/repositories/dynamodb_helper.py`
2. Follow the pattern of existing functions
3. Use boto3 for DynamoDB operations

### Building Locally

#### TypeScript
```bash
cd backend/lambda-layers/data-repositories/nodejs
npm install
npm run build
```

#### Python
No build step required - Python files are used directly.

### Testing

After making changes, deploy via Terraform:
```bash
cd infra
terraform apply
```

The layer versions will be updated and the Lambda functions will automatically use the new versions.

## Benefits

1. **Code Reusability**: Shared logic between TypeScript and Python implementations
2. **Maintainability**: Single source of truth for data access patterns
3. **Performance**: Layers are cached by Lambda, reducing cold start times
4. **Size Optimization**: Smaller deployment packages for Lambda functions
5. **Version Control**: Layer versions are managed independently

## Notes

- The TypeScript layer includes both compiled JavaScript and TypeScript definitions
- The Python layer provides a simplified interface focused on write operations
- Both layers follow the same DynamoDB schema and key structure
- Date formats are handled consistently across both implementations
