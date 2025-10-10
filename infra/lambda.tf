data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

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
  function_name    = "${local.normalized_prefix}-api"
  role             = aws_iam_role.api.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.api_bundle.output_path
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
