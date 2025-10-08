terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }

    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

locals {
  normalized_prefix = lower("${var.project}-${var.environment}")
  web_bucket_name   = coalesce(var.web_bucket_name, "${local.normalized_prefix}-${random_string.web_bucket_suffix.result}")
  web_build_path    = abspath("${path.module}/${var.web_build_path}")
  web_asset_files   = try(fileset(local.web_build_path, "**"), [])

  api_origin_id = "lambda-function-origin"
  web_origin_id = "s3-web-origin"

  mime_types = {
    ".avif" = "image/avif"
    ".css"  = "text/css"
    ".html" = "text/html"
    ".ico"  = "image/x-icon"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".map"  = "application/json"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".txt"  = "text/plain"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
  }

  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "random_string" "web_bucket_suffix" {
  length  = 6
  upper   = false
  lower   = true
  special = false
}

# --- Static web hosting bucket ---
resource "aws_s3_bucket" "web" {
  bucket = local.web_bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket = aws_s3_bucket.web.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_identity" "web" {
  comment = "Access identity for ${aws_s3_bucket.web.bucket}"
}

data "aws_iam_policy_document" "web_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web.arn}/*"]

    principals {
      type        = "CanonicalUser"
      identifiers = [aws_cloudfront_origin_access_identity.web.s3_canonical_user_id]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = data.aws_iam_policy_document.web_bucket_policy.json
}

# --- Upload built web assets ---
resource "aws_s3_object" "web_assets" {
  for_each = { for file in local.web_asset_files : file => file }

  bucket = aws_s3_bucket.web.id
  key    = each.key
  source = "${local.web_build_path}/${each.key}"
  etag   = filemd5("${local.web_build_path}/${each.key}")

  content_type = lookup(local.mime_types, try(regexall("\\.[^.]+$", lower(each.key))[0], ""), "binary/octet-stream")

  depends_on = [aws_s3_bucket_policy.web]
}

# --- Lambda packaging and execution ---
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.normalized_prefix}-api"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_iam_role" "api" {
  name               = "${local.normalized_prefix}-api-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

data "aws_iam_policy_document" "api_logging" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }
}

resource "aws_iam_role_policy" "api_logging" {
  name   = "${local.normalized_prefix}-api-logging"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api_logging.json
}

resource "aws_iam_role_policy_attachment" "api_basic_execution" {
  role       = aws_iam_role.api.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "api_vpc_execution" {
  role       = aws_iam_role.api.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"

  lifecycle {
    ignore_changes = [policy_arn]
  }
}

resource "null_resource" "lambda_build" {
  triggers = {
    handler_hash = filemd5("${path.module}/../backend/lambda/handler.ts")
    types_hash   = filemd5("${path.module}/../backend/lambda/types.ts")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend/lambda"
    command     = "npm install && npm run build"
  }
}

data "archive_file" "api_bundle" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/dist"
  output_path = "${path.module}/build/api-lambda.zip"

  depends_on = [null_resource.lambda_build]
}

resource "aws_lambda_function" "api" {
  function_name = "${local.normalized_prefix}-api"
  role          = aws_iam_role.api.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      STAGE = var.environment
    }
  }

  tags = local.tags

  depends_on = [aws_iam_role_policy_attachment.api_basic_execution]
}

# --- API Gateway ---
resource "aws_apigatewayv2_api" "api" {
  name          = "${local.normalized_prefix}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "HEAD", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = local.tags
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.normalized_prefix}-cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.main.id]
    issuer   = "https://${aws_cognito_user_pool.main.endpoint}"
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"

  integration_uri        = aws_lambda_function.api.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_root" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "api_proxy" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/{proxy+}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "api_head" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "HEAD /api/{proxy+}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /api/{proxy+}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
      authorizerError = "$context.authorizer.error"
    })
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.normalized_prefix}-api"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# --- CloudFront distribution ---
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "Distribution for ${var.project} ${var.environment}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  is_ipv6_enabled     = true

  origin {
    domain_name = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id   = local.web_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.web.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = replace(replace(aws_apigatewayv2_api.api.api_endpoint, "https://", ""), "/", "")
    origin_id   = local.api_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.web_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # Managed-SecurityHeadersPolicy
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.api_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id           = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id  = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = local.tags
}

# --- Cognito User Pool ---
resource "aws_cognito_user_pool" "main" {
  name = "${local.normalized_prefix}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = local.tags
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.normalized_prefix}-${random_string.web_bucket_suffix.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.normalized_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  refresh_token_validity               = 1
  access_token_validity                = 1
  id_token_validity                    = 1
  token_validity_units {
    refresh_token = "days"
    access_token  = "days"
    id_token      = "days"
  }

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # OAuth Configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "phone", "profile", "aws.cognito.signin.user.admin"]
  
  callback_urls = [
    "https://d1cus83lrz11k.cloudfront.net",
    "http://localhost:5173"
  ]
  
  logout_urls = [
    "https://d1cus83lrz11k.cloudfront.net",
    "http://localhost:5173"
  ]
  
  supported_identity_providers = ["COGNITO"]

  prevent_user_existence_errors = "ENABLED"

  read_attributes = [
    "email",
    "email_verified"
  ]

  write_attributes = [
    "email"
  ]
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.normalized_prefix}-identity-pool"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = true
  }

  tags = local.tags
}

# IAM roles for Cognito Identity Pool
data "aws_iam_policy_document" "cognito_authenticated_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.main.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "cognito_authenticated" {
  name               = "${local.normalized_prefix}-cognito-authenticated"
  assume_role_policy = data.aws_iam_policy_document.cognito_authenticated_assume_role.json
  tags               = local.tags
}

data "aws_iam_policy_document" "cognito_authenticated_policy" {
  statement {
    effect = "Allow"
    actions = [
      "mobileanalytics:PutEvents",
      "cognito-sync:*",
      "cognito-identity:*"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "execute-api:Invoke"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "cognito_authenticated" {
  name   = "${local.normalized_prefix}-cognito-authenticated-policy"
  role   = aws_iam_role.cognito_authenticated.id
  policy = data.aws_iam_policy_document.cognito_authenticated_policy.json
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.cognito_authenticated.arn
  }
}

# --- Create config.json for frontend ---
locals {
  config_json = jsonencode({
    region           = data.aws_region.current.name
    userPoolId       = aws_cognito_user_pool.main.id
    userPoolClientId = aws_cognito_user_pool_client.main.id
    identityPoolId   = aws_cognito_identity_pool.main.id
    apiEndpoint      = "https://${aws_cloudfront_distribution.site.domain_name}/api"
  })
}

resource "aws_s3_object" "config_json" {
  bucket       = aws_s3_bucket.web.id
  key          = "config.json"
  content      = local.config_json
  content_type = "application/json"
  etag         = md5(local.config_json)

  depends_on = [aws_s3_bucket_policy.web]
}

# --- Outputs ---
output "web_bucket_name" {
  description = "Name of the S3 bucket hosting the web application"
  value       = aws_s3_bucket.web.bucket
}

output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.id
}

output "cognito_config_url" {
  description = "URL to fetch Cognito configuration"
  value       = "https://${aws_cloudfront_distribution.site.domain_name}/config.json"
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}
