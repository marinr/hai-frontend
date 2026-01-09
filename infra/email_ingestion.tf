data "aws_s3_bucket" "email_ingestion" {
  bucket = var.email_ingestion_bucket_name
}

resource "aws_sqs_queue" "email_ingestion_fifo" {
  name                        = "${local.normalized_prefix}-email-events.fifo"
  fifo_queue                  = true
  content_based_deduplication = false
  deduplication_scope         = "queue"
  fifo_throughput_limit       = "perQueue"
  visibility_timeout_seconds  = 60  # Standard timeout for email ingestion
  message_retention_seconds   = 1209600
  tags                        = local.tags
}

resource "aws_cloudwatch_log_group" "email_ingestion" {
  name              = "/aws/lambda/${local.normalized_prefix}-email-ingestion"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_iam_role" "email_ingestion" {
  name               = "${local.normalized_prefix}-email-ingestion-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "email_ingestion_basic_execution" {
  role       = aws_iam_role.email_ingestion.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "email_ingestion_logging" {
  name = "${local.normalized_prefix}-email-ingestion-logging"
  role = aws_iam_role.email_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.email_ingestion.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "email_ingestion_s3_access" {
  name = "${local.normalized_prefix}-email-ingestion-s3"
  role = aws_iam_role.email_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${data.aws_s3_bucket.email_ingestion.arn}/emails/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "email_ingestion_sqs_access" {
  name = "${local.normalized_prefix}-email-ingestion-sqs"
  role = aws_iam_role.email_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [aws_sqs_queue.email_ingestion_fifo.arn]
      }
    ]
  })
}

resource "null_resource" "email_ingestion_build" {
  triggers = {
    source_hash = sha1(join("", [
      for file in fileset("${path.module}/../backend/email-ingestion-lambda/src", "**") :
      filesha1("${path.module}/../backend/email-ingestion-lambda/src/${file}")
    ]))
    package  = filemd5("${path.module}/../backend/email-ingestion-lambda/package.json")
    lockfile = filemd5("${path.module}/../backend/email-ingestion-lambda/package-lock.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend/email-ingestion-lambda"
    command     = <<EOT
      npm install && npm run build && \
      cp -r node_modules dist/ && \
      cp package.json dist/
    EOT
  }
}

data "archive_file" "email_ingestion_bundle" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/email-ingestion-lambda/dist"
  output_path = "${path.module}/build/email-ingestion-lambda.zip"

  depends_on = [null_resource.email_ingestion_build]
}

resource "aws_lambda_function" "email_ingestion" {
  function_name    = "${local.normalized_prefix}-email-ingestion"
  role             = aws_iam_role.email_ingestion.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.email_ingestion_bundle.output_path
  source_code_hash = data.archive_file.email_ingestion_bundle.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      EMAIL_FIFO_QUEUE_URL        = aws_sqs_queue.email_ingestion_fifo.url
      EMAIL_FIFO_MESSAGE_GROUP_ID = local.normalized_prefix
    }
  }

  tags = local.tags

  depends_on = [
    aws_iam_role_policy_attachment.email_ingestion_basic_execution,
    aws_iam_role_policy.email_ingestion_logging,
    aws_iam_role_policy.email_ingestion_s3_access,
    aws_iam_role_policy.email_ingestion_sqs_access
  ]
}

resource "aws_lambda_permission" "allow_s3_email_ingestion" {
  statement_id  = "AllowExecutionFromS3EmailIngestion"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_ingestion.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = data.aws_s3_bucket.email_ingestion.arn
}

resource "aws_s3_bucket_notification" "email_ingestion" {
  bucket = data.aws_s3_bucket.email_ingestion.bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.email_ingestion.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "emails/"
  }

  depends_on = [aws_lambda_permission.allow_s3_email_ingestion]
}
