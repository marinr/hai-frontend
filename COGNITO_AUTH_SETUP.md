# Cognito Authentication Setup

This document describes the AWS Cognito authentication implementation added to the infrastructure.

## Overview

The infrastructure now includes a complete AWS Cognito authentication setup integrated with the existing Lambda API and CloudFront distribution.

## What Was Added

### 1. **Cognito User Pool** (`infra/main.tf`)
- Email-based authentication (users sign in with email)
- Password policy requirements:
  - Minimum 8 characters
  - Requires uppercase, lowercase, numbers, and symbols
- Email verification enabled
- Self-service user registration enabled
- Password recovery via verified email

### 2. **Cognito User Pool Client**
- Token validity: 1 day for all token types (access, ID, refresh)
- Supported authentication flows:
  - `ALLOW_USER_SRP_AUTH` - Secure Remote Password protocol
  - `ALLOW_REFRESH_TOKEN_AUTH` - Refresh token support
  - `ALLOW_USER_PASSWORD_AUTH` - Username/password authentication
- No client secret (suitable for browser-based apps)

### 3. **Cognito Identity Pool**
- Connected to the User Pool
- Provides AWS credentials for authenticated users
- IAM roles for authenticated access
- Permissions include:
  - Cognito Sync
  - Mobile Analytics
  - API Gateway execution

### 4. **CloudFront Integration**
- Custom headers passed to Lambda origin:
  - `x-user-pool-id`: The Cognito User Pool ID
  - `x-user-pool-client-id`: The User Pool Client ID
- These headers allow the Lambda function to validate tokens

### 5. **Lambda Token Validation** (`backend/lambda/handler.ts`)
- Added `aws-jwt-verify` dependency for token validation
- Token verification middleware that:
  - Extracts JWT from Authorization header
  - Validates token signature and expiration
  - Verifies token against the correct User Pool
  - Returns 401 Unauthorized for invalid/missing tokens
- All API endpoints except OPTIONS and HEAD require authentication

### 6. **Frontend Configuration** (`config.json`)
- Automatically deployed to S3 bucket
- Contains all Cognito configuration needed by the frontend:
  ```json
  {
    "region": "us-east-1",
    "userPoolId": "us-east-1_XXXXXXX",
    "userPoolClientId": "xxxxxxxxxxxxxxxxxxxx",
    "identityPoolId": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "apiEndpoint": "https://xxxxx.execute-api.us-east-1.amazonaws.com"
  }
  ```

## Architecture Flow

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. User signs in
       ▼
┌─────────────────────┐
│  Cognito User Pool  │
│                     │
│  - Validates creds  │
│  - Issues JWT       │
└──────┬──────────────┘
       │ 2. Returns access token
       ▼
┌─────────────┐
│   Browser   │ 3. Includes token in API requests
│             │    Authorization: Bearer <token>
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│    CloudFront       │
│                     │
│  Adds custom headers│
│  - x-user-pool-id   │
│  - x-client-id      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Lambda Function    │
│                     │
│  1. Extracts token  │
│  2. Verifies with   │
│     Cognito         │
│  3. Processes if    │
│     valid           │
└─────────────────────┘
```

## Deployment

### Prerequisites
- AWS credentials configured
- Terraform installed
- Node.js and npm installed

### Deploy Steps

1. **Initialize Terraform** (if not already done):
   ```bash
   cd infra
   terraform init
   ```

2. **Review the changes**:
   ```bash
   terraform plan
   ```

3. **Apply the infrastructure**:
   ```bash
   terraform apply
   ```

4. **Note the outputs**:
   After deployment, Terraform will output:
   - `user_pool_id`: Your Cognito User Pool ID
   - `user_pool_client_id`: Your User Pool Client ID
   - `identity_pool_id`: Your Identity Pool ID
   - `cognito_config_url`: URL to fetch config.json
   - `distribution_domain_name`: Your CloudFront domain

## Frontend Integration

### Step 1: Install AWS Amplify (Recommended)

```bash
cd web
npm install aws-amplify @aws-amplify/ui-react
```

### Step 2: Fetch Configuration

The frontend should fetch `/config.json` on startup to get Cognito details:

```typescript
// src/config.ts
export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  apiEndpoint: string;
}

export async function loadConfig(): Promise<CognitoConfig> {
  const response = await fetch('/config.json');
  return response.json();
}
```

### Step 3: Configure Amplify

```typescript
// src/main.tsx or App.tsx
import { Amplify } from 'aws-amplify';
import { loadConfig } from './config';

const config = await loadConfig();

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolClientId,
      identityPoolId: config.identityPoolId,
      region: config.region,
    }
  }
});
```

### Step 4: Add Authentication UI

```typescript
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user?.username}</h1>
          <button onClick={signOut}>Sign out</button>
          {/* Your app content */}
        </main>
      )}
    </Authenticator>
  );
}
```

### Step 5: Make Authenticated API Calls

```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

async function fetchDashboard() {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  
  const response = await fetch('/api/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

## Testing Authentication

### 1. Create a Test User

Using AWS CLI:
```bash
aws cognito-idp sign-up \
  --client-id YOUR_CLIENT_ID \
  --username test@example.com \
  --password 'TestPassword123!' \
  --user-attributes Name=email,Value=test@example.com
```

### 2. Confirm the User

Admin confirm (for testing):
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR_POOL_ID \
  --username test@example.com
```

### 3. Sign In and Get Token

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=test@example.com,PASSWORD='TestPassword123!'
```

This returns an access token you can use for API testing.

### 4. Test API with Token

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_CLOUDFRONT_DOMAIN/api/dashboard
```

Expected: 200 OK with dashboard data

Without token:
```bash
curl https://YOUR_CLOUDFRONT_DOMAIN/api/dashboard
```

Expected: 401 Unauthorized

## Security Considerations

### Current Setup
- ✅ Tokens validated on every request
- ✅ Token signature verification
- ✅ Expiration checking
- ✅ No public API access without authentication
- ✅ User Pool IDs passed via CloudFront (not exposed to public)
- ✅ CORS configured for security

### Production Recommendations
1. **Use Custom Domain**: Add a custom domain to CloudFront with SSL certificate
2. **Configure MFA**: Enable multi-factor authentication for sensitive operations
3. **Add Rate Limiting**: Use AWS WAF to prevent brute force attacks
4. **Session Management**: Implement proper token refresh logic in frontend
5. **Audit Logging**: Enable CloudTrail for Cognito events
6. **Password Policies**: Consider stricter password requirements
7. **Account Lockout**: Configure account lockout after failed login attempts

## Cost Estimate

Cognito pricing (as of 2024):
- **Free tier**: 50,000 MAUs (Monthly Active Users)
- **Beyond free tier**: $0.0055 per MAU
- **Advanced security features**: Additional costs for MFA, risk-based authentication

For a small application with <50K users, Cognito is free.

## Troubleshooting

### Issue: 401 Unauthorized Error
**Cause**: Token missing, invalid, or expired
**Solution**:
- Check that Authorization header includes `Bearer <token>`
- Verify token hasn't expired (1 day validity)
- Re-authenticate to get a new token

### Issue: "Missing authentication configuration"
**Cause**: CloudFront custom headers not reaching Lambda
**Solution**:
- Verify CloudFront distribution has custom headers configured
- Wait for CloudFront distribution to fully deploy (~15 minutes)
- Check Lambda logs for exact error

### Issue: CORS Errors in Browser
**Cause**: OPTIONS preflight request failing
**Solution**:
- Verify CORS headers in Lambda response
- Check browser console for specific CORS error
- Ensure Lambda CORS configuration matches frontend origin

## Next Steps

1. **Frontend Integration**: Implement Amplify authentication in the React app
2. **User Management**: Add user profile pages and account management
3. **Role-Based Access**: Add user roles/groups for different permission levels
4. **Enhanced Security**: Enable MFA for production use
5. **Monitoring**: Set up CloudWatch alarms for authentication failures
6. **Testing**: Create automated tests for authentication flows

## References

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [aws-jwt-verify Library](https://github.com/awslabs/aws-jwt-verify)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/security.html)
