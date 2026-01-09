#!/bin/bash
set -e

echo "================================================"
echo "     HAI System - Full Deployment Script"
echo "================================================"
echo ""

# ============================================
# PHASE 1: BUILD BACKEND COMPONENTS
# ============================================

echo "========================================"
echo "  PHASE 1: Building Backend Components"
echo "========================================"
echo ""

# Step 1: Build Lambda Layer - Node.js (data-repositories)
echo "📦 Step 1: Building Lambda Layer (Node.js - data-repositories)..."
cd backend/lambda-layers/data-repositories/nodejs
npm install
npm run build
cd ../../../..
echo "✅ Node.js Lambda Layer built successfully"
echo ""

# Step 2: Package Lambda Layer - Python (data-repositories)
echo "📦 Step 2: Packaging Lambda Layer (Python - data-repositories)..."
echo "✅ Python Lambda Layer ready (no build step required)"
echo ""

# Step 3: Build hai-api-lambda
echo "📦 Step 3: Building hai-api-lambda..."
cd backend/hai-api-lambda
npm install
npm run build
# Copy node_modules and package.json to dist for Lambda deployment
cp -r node_modules dist/
cp package.json dist/
cd ../..
echo "✅ hai-api-lambda built successfully"
echo ""

# Step 4: Build email-ingestion-lambda
echo "📦 Step 4: Building email-ingestion-lambda..."
cd backend/email-ingestion-lambda
npm install
npm run build
# Copy node_modules and package.json to dist for Lambda deployment
cp -r node_modules dist/
cp package.json dist/
cd ../..
echo "✅ email-ingestion-lambda built successfully"
echo ""

# Step 5: Package multi-agentic-data-processor
echo "📦 Step 5: Packaging multi-agentic-data-processor (Python)..."
cd backend/multi-agentic-data-processor

# Clean previous builds
rm -rf package lambda_deployment.zip

# Create package directory
mkdir package

# Install Python dependencies with Lambda-compatible binaries
echo "   Installing Python dependencies..."
pip install -r requirements.txt \
  -t package \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --quiet

# Copy Python source files to package
echo "   Copying source files..."
cp *.py package/

# Create deployment ZIP
echo "   Creating deployment package..."
cd package
zip -r ../lambda_deployment.zip . -q
cd ..

echo "✅ multi-agentic-data-processor packaged successfully"
cd ../..
echo ""

# ============================================
# PHASE 2: DEPLOY INFRASTRUCTURE
# ============================================

echo "========================================"
echo "  PHASE 2: Deploying Infrastructure"
echo "========================================"
echo ""

echo "🏗️  Step 6: Deploying infrastructure with Terraform..."
cd infra
terraform apply -auto-approve
echo "✅ Infrastructure deployed successfully"
echo ""

# ============================================
# PHASE 3: BUILD AND DEPLOY FRONTEND
# ============================================

echo "========================================"
echo "  PHASE 3: Building and Deploying Frontend"
echo "========================================"
echo ""

echo "🎨 Step 7: Building frontend..."
cd ../web
npm install
npm run build
echo "✅ Frontend built successfully"
echo ""

echo "☁️  Step 8: Deploying frontend to S3..."
cd ../infra

# Get S3 bucket name from Terraform
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
echo "   Deploying to bucket: $BUCKET_NAME"

# Sync build to S3
aws s3 sync ../web/dist s3://$BUCKET_NAME/ --delete

echo "✅ Frontend deployed to S3"
echo ""

echo "🔄 Step 9: Invalidating CloudFront cache..."
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
echo "   CloudFront Distribution ID: $CLOUDFRONT_ID"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
echo ""

# ============================================
# DEPLOYMENT SUMMARY
# ============================================

echo "================================================"
echo "           ✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Components Deployed:"
echo "  ✅ Lambda Layer: data-repositories (Node.js)"
echo "  ✅ Lambda Layer: data-repositories (Python)"
echo "  ✅ Lambda: hai-api-lambda"
echo "  ✅ Lambda: email-ingestion-lambda"
echo "  ✅ Lambda: multi-agentic-data-processor"
echo "  ✅ Frontend: React/Vite application"
echo ""

CLOUDFRONT_URL=$(terraform output -raw cloudfront_distribution_url)
echo "🌐 Frontend URL: https://$CLOUDFRONT_URL"
echo "🔌 API Base URL: https://$CLOUDFRONT_URL/api"
echo ""
echo "⏰ Please wait 2-3 minutes for CloudFront invalidation"
echo "   to complete before testing the application."
echo ""
echo "📋 Test the API with:"
echo "   curl -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "     https://$CLOUDFRONT_URL/api/properties"
echo ""
