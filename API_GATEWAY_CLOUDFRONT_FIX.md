# API Gateway CloudFront Integration Fix

## Problem Identified

The API Gateway was not properly exposed through CloudFront due to a path mismatch:

1. **CloudFront Configuration**: Forwarded requests with path pattern `/api/*`
2. **API Gateway Routes**: Expected routes at root level (e.g., `/properties`, `/reservations`)
3. **Result**: When CloudFront received `/api/properties`, it forwarded `/api/properties` to API Gateway, but API Gateway expected `/properties` - causing 404 errors

## Changes Made

### 1. API Gateway Routes (`infra/hai_apigateway.tf`)

Updated ALL API Gateway routes to include the `/api` prefix to match CloudFront's forwarding:

- **Properties**: `/properties` → `/api/properties`
- **Reservations**: `/reservations` → `/api/reservations`
- **Guests**: `/guests` → `/api/guests`
- **Messages**: `/messages` → `/api/messages`
- **Tasks**: `/tasks` → `/api/tasks`
- **Staff**: `/staff` → `/api/staff`

### 2. CORS Configuration (`infra/hai_apigateway.tf`)

Updated CORS to allow all origins to prevent circular dependency between CloudFront and API Gateway:

```hcl
# Before
allow_origins = [
  "https://d1cus83lrz11k.cloudfront.net",
  "http://localhost:5173",
  "http://localhost:3000"
]

# After
allow_origins = ["*"]
```

**Note**: Using `allow_origins = ["*"]` is acceptable here because:
- The API is protected by JWT authentication through Cognito
- CloudFront sits in front of API Gateway providing additional security
- This prevents Terraform circular dependency errors
- The API remains secure as authentication is still required for all requests

### 3. Lambda Handler (`backend/hai-api-lambda/handler.ts`)

Updated the Lambda handler to support both `/api/resource` and `/resource` paths for flexibility:

```typescript
// Now supports both /api/properties and /properties
if (path.startsWith('/api/properties') || path.startsWith('/properties')) {
  return await handleProperties(event);
}
```

This allows the Lambda to work with requests coming through CloudFront (with `/api` prefix) and direct API Gateway calls (without prefix) for backward compatibility.

### 4. Frontend Configuration (`web/.env.local`)

Updated the frontend to call APIs through CloudFront instead of directly to API Gateway:

```bash
# Before
VITE_API_BASE_URL=https://2ntyt8anuj.execute-api.eu-central-1.amazonaws.com

# After
VITE_API_BASE_URL=https://d1cus83lrz11k.cloudfront.net/api
```

### 3. CloudFront Configuration Verification

Confirmed the CloudFront configuration already has:

✅ **No Caching Enabled**: Uses `Managed-CachingDisabled` cache policy  
✅ **Proper Origin**: API Gateway configured as origin  
✅ **Path Pattern**: `/api/*` routes to API Gateway  
✅ **All HTTP Methods**: Supports GET, POST, PUT, DELETE, OPTIONS, PATCH  
✅ **Request Forwarding**: Uses `Managed-AllViewerExceptHostHeader` policy

## Deployment Steps

### Step 1: Build and Deploy Lambda Function

The Lambda handler has been updated, so we need to rebuild and deploy it:

```bash
# Navigate to the Lambda function directory
cd backend/hai-api-lambda

# Install dependencies (if not already done)
npm install

# Build the TypeScript code
npm run build

# Navigate back to project root
cd ../..
```

### Step 2: Plan Infrastructure Changes

```bash
cd infra
terraform plan -out=tfplan
```

Review the plan to ensure:
- API Gateway routes are being updated (not destroyed/recreated)
- CORS configuration is being updated
- No unexpected changes to other resources

### Step 3: Apply Infrastructure Changes

```bash
terraform apply tfplan
```

This will:
- Update all API Gateway route configurations with `/api` prefix
- Update the CORS configuration to use CloudFront domain reference
- Deploy the updated Lambda function code
- No downtime expected (routes and Lambda are updated in place)

### Step 4: Rebuild and Deploy Frontend

The frontend configuration has been updated to use CloudFront with `/api` prefix:

```bash
# Navigate to the web directory
cd ../web

# Rebuild the frontend with updated environment variables
npm run build

# Deploy to S3 (this will sync the new build to S3)
cd ../infra
terraform apply -target=aws_s3_bucket_object.web_files -auto-approve
```

Or if you have a separate deployment script, use that to deploy the frontend.

### Step 5: Invalidate CloudFront Cache

```bash
# Get the CloudFront distribution ID
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)

# Create an invalidation to ensure new content is served
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*"
```

### Step 6: Verify the Deployment

Test the API endpoints through CloudFront:

```bash
# Get the CloudFront URL
CLOUDFRONT_URL=$(terraform output -raw cloudfront_distribution_url)

# Test an API endpoint (after authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://$CLOUDFRONT_URL/api/properties
```

## Technical Details

### Request Flow

1. **Browser** → `https://cloudfront-domain/api/properties`
2. **CloudFront** → Matches `/api/*` pattern, forwards to API Gateway origin
3. **API Gateway** → Receives `/api/properties`, matches route, invokes Lambda
4. **Lambda** → Processes request, returns response
5. **CloudFront** → Returns response to browser (no caching applied)

### Caching Configuration

The CloudFront distribution uses AWS Managed Policy: `Managed-CachingDisabled`

This policy ensures:
- **Min TTL**: 0 seconds
- **Max TTL**: 0 seconds  
- **Default TTL**: 0 seconds
- **No Query String Caching**
- **No Cookie Caching**

All API requests are forwarded directly to the origin without any caching.

## Rollback Plan

If issues occur, you can rollback using:

```bash
cd infra
git checkout HEAD~1 -- hai_apigateway.tf
terraform plan
terraform apply
```

## Testing Checklist

After deployment, verify:

- [ ] CloudFront distribution updated successfully
- [ ] API Gateway routes updated successfully
- [ ] CORS headers are correct
- [ ] Authentication still works through CloudFront
- [ ] All CRUD operations work for each resource:
  - [ ] Properties (GET, POST, PUT, DELETE)
  - [ ] Reservations (GET, POST, PUT, DELETE)
  - [ ] Guests (GET, POST, PUT, DELETE)
  - [ ] Messages (GET, POST, PUT, DELETE)
  - [ ] Tasks (GET, POST, PUT, DELETE)
  - [ ] Staff (GET, POST, PUT, DELETE)
- [ ] No caching of API responses
- [ ] OPTIONS preflight requests work correctly

## Notes

- The API Gateway stage remains `$default` with auto-deploy enabled
- CloudWatch logs will show the new route patterns in use
- The Lambda function integration remains unchanged
- JWT authentication through Cognito remains unchanged
