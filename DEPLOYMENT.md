# Deployment Guide

## Prerequisites

Before deploying, you need to configure AWS credentials. Choose one of the following methods:

### Option 1: AWS CLI Configuration (Recommended)
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-central-1`)
- Default output format (e.g., `json`)

### Option 2: Environment Variables
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="eu-central-1"
```

### Option 3: AWS SSO (if your organization uses it)
```bash
aws sso login --profile your-profile-name
export AWS_PROFILE=your-profile-name
```

## Deployment Steps

### 1. Build the Frontend
```bash
cd web
npm install
npm run build
cd ..
```

### 2. Initialize and Deploy Infrastructure
```bash
cd infra
terraform init
terraform apply
```

Review the plan and type `yes` to confirm deployment.

### 3. Get Output Values
After successful deployment, Terraform will output important values:
```bash
terraform output
```

You'll get:
- `distribution_domain_name` - Your CloudFront URL
- `user_pool_id` - Cognito User Pool ID
- `user_pool_client_id` - Cognito Client ID
- `cognito_domain` - Cognito hosted UI domain

### 4. Update Cognito Callback URLs

After deployment, you need to manually update the Cognito User Pool Client with the CloudFront URL:

**Via AWS Console:**
1. Go to AWS Cognito console
2. Select your User Pool
3. Go to "App integration" > "App clients"
4. Select your app client
5. Edit "Hosted UI" settings
6. Add to Callback URLs:
   - `https://<your-cloudfront-domain>`
   - `http://localhost:5173` (for local dev)
7. Add to Sign out URLs:
   - `https://<your-cloudfront-domain>`
   - `http://localhost:5173` (for local dev)
8. Save changes

**Via AWS CLI:**
```bash
CLOUDFRONT_DOMAIN=$(cd infra && terraform output -raw distribution_domain_name)
USER_POOL_ID=$(cd infra && terraform output -raw user_pool_id)
CLIENT_ID=$(cd infra && terraform output -raw user_pool_client_id)

aws cognito-idp update-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --callback-urls "https://$CLOUDFRONT_DOMAIN" "http://localhost:5173" \
  --logout-urls "https://$CLOUDFRONT_DOMAIN" "http://localhost:5173" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "email" "openid" "phone" "profile" "aws.cognito.signin.user.admin" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO"
```

### 5. Update Frontend Environment Variables

Update `web/.env.local` with the deployed values:
```bash
VITE_API_BASE_URL=https://<api-gateway-domain>
VITE_COGNITO_USER_POOL_ID=<user-pool-id>
VITE_COGNITO_CLIENT_ID=<client-id>
VITE_COGNITO_REDIRECT_URI=https://<cloudfront-domain>
VITE_COGNITO_DOMAIN=<cognito-domain>
```

### 6. Test the Deployment

Visit your CloudFront URL: `https://<your-cloudfront-domain>`

You should see:
1. Sign-in page (if not authenticated)
2. Redirect to Cognito hosted UI when clicking "Sign In"
3. After authentication, return to your app with full access

## Creating Test Users

### Via AWS Console:
1. Go to Cognito User Pool
2. Click "Users" tab
3. Click "Create user"
4. Enter email and temporary password
5. User will receive verification email

### Via AWS CLI:
```bash
USER_POOL_ID=$(cd infra && terraform output -raw user_pool_id)

aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

## Updating the Deployment

When you make changes to the frontend:
```bash
cd web
npm run build
cd ../infra
terraform apply
```

Terraform will automatically upload the new build to S3 and invalidate the CloudFront cache.

## Troubleshooting

### Authentication not working
1. Check that callback URLs are correctly configured in Cognito
2. Verify environment variables in `.env.local`
3. Check browser console for CORS errors
4. Ensure Cognito domain is correctly formatted

### CloudFront showing old content
```bash
# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Distribution for hai-frontend dev'].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### "BadRequest" error on sign-in
- Check that the Cognito domain URL is correct
- Verify OAuth scopes are properly configured
- Ensure callback URLs match exactly

## Cost Considerations

This setup uses:
- CloudFront (pay per request)
- S3 (pay per storage/requests)
- Lambda (pay per invocation)
- Cognito (first 50,000 MAUs free)

Estimated cost for low traffic: $1-5/month

## Cleanup

To destroy all resources:
```bash
cd infra
terraform destroy
```

**Warning**: This will permanently delete all data!
