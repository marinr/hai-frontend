locals {
  normalized_prefix = lower("${var.project}-${var.environment}")
  web_bucket_name   = coalesce(var.web_bucket_name, "${local.normalized_prefix}-${random_string.web_bucket_suffix.result}")
  web_build_path    = abspath("${path.module}/${var.web_build_path}")
  web_asset_files   = try(fileset(local.web_build_path, "**"), [])

  api_origin_id = "lambda-function-origin"
  web_origin_id = "s3-web-origin"

  mime_types = {
    ".avif"  = "image/avif"
    ".css"   = "text/css"
    ".html"  = "text/html"
    ".ico"   = "image/x-icon"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".js"    = "application/javascript"
    ".json"  = "application/json"
    ".map"   = "application/json"
    ".png"   = "image/png"
    ".svg"   = "image/svg+xml"
    ".txt"   = "text/plain"
    ".webp"  = "image/webp"
    ".woff"  = "font/woff"
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

locals {
  config_json = jsonencode({
    region           = data.aws_region.current.name
    userPoolId       = aws_cognito_user_pool.main.id
    userPoolClientId = aws_cognito_user_pool_client.main.id
    identityPoolId   = aws_cognito_identity_pool.main.id
    apiEndpoint      = "https://${aws_cloudfront_distribution.site.domain_name}/api"
  })
}
