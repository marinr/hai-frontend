# IAM Role for HAI API Lambda
resource "aws_iam_role" "hai_api" {
  name               = "${local.normalized_prefix}-hai-api-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

# CloudWatch Logs for HAI API Lambda
resource "aws_cloudwatch_log_group" "hai_api" {
  name              = "/aws/lambda/${local.normalized_prefix}-hai-api"
  retention_in_days = 14
  tags              = local.tags
}

# Logging Policy
resource "aws_iam_role_policy" "hai_api_logging" {
  name = "${local.normalized_prefix}-hai-api-logging"
  role = aws_iam_role.hai_api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.hai_api.arn}:*"
      }
    ]
  })
}

# DynamoDB Policy
resource "aws_iam_role_policy" "hai_api_dynamodb" {
  name = "${local.normalized_prefix}-hai-api-dynamodb"
  role = aws_iam_role.hai_api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.hai_data.arn,
          "${aws_dynamodb_table.hai_data.arn}/index/*"
        ]
      }
    ]
  })
}

# Build Lambda package
resource "null_resource" "hai_lambda_build" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend/hai-api-lambda"
    command     = <<EOT
      npm install && npm run build && \
      cp -r node_modules dist/ && \
      cp package.json dist/
    EOT
  }
}

# Create Lambda deployment package
data "archive_file" "hai_api_bundle" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/hai-api-lambda/dist"
  output_path = "${path.module}/build/hai-api-lambda.zip"

  depends_on = [null_resource.hai_lambda_build]
}

# Lambda Function
resource "aws_lambda_function" "hai_api" {
  function_name    = "${local.normalized_prefix}-hai-api"
  role             = aws_iam_role.hai_api.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.hai_api_bundle.output_path
  source_code_hash = data.archive_file.hai_api_bundle.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  layers = [
    aws_lambda_layer_version.data_repositories_nodejs.arn
  ]

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.hai_data.name
      STAGE               = var.environment
    }
  }

  tags = local.tags

  depends_on = [
    aws_iam_role_policy.hai_api_logging,
    aws_iam_role_policy.hai_api_dynamodb,
    aws_lambda_layer_version.data_repositories_nodejs
  ]
}
