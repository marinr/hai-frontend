resource "random_string" "web_bucket_suffix" {
  length  = 6
  upper   = false
  lower   = true
  special = false
}

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

resource "aws_s3_object" "web_assets" {
  for_each = { for file in local.web_asset_files : file => file }

  bucket = aws_s3_bucket.web.id
  key    = each.key
  source = "${local.web_build_path}/${each.key}"
  etag   = filemd5("${local.web_build_path}/${each.key}")

  content_type = lookup(local.mime_types, try(regexall("\\.[^.]+$", lower(each.key))[0], ""), "binary/octet-stream")

  depends_on = [aws_s3_bucket_policy.web]
}

resource "aws_s3_object" "config_json" {
  bucket       = aws_s3_bucket.web.id
  key          = "config.json"
  content      = local.config_json
  content_type = "application/json"
  etag         = md5(local.config_json)

  depends_on = [aws_s3_bucket_policy.web]
}
