# HAI API Gateway
resource "aws_apigatewayv2_api" "hai_api" {
  name          = "${local.normalized_prefix}-hai-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "https://d1cus83lrz11k.cloudfront.net",
      "http://localhost:5173",
      "http://localhost:3000"
    ]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = [
      "content-type",
      "x-amz-date",
      "authorization",
      "x-api-key",
      "x-amz-security-token",
      "x-amz-user-agent"
    ]
    expose_headers = ["*"]
    allow_credentials = false
    max_age       = 300
  }

  tags = local.tags
}

# Lambda Integration
resource "aws_apigatewayv2_integration" "hai_lambda" {
  api_id           = aws_apigatewayv2_api.hai_api.id
  integration_type = "AWS_PROXY"

  integration_uri        = aws_lambda_function.hai_api.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Properties Routes
resource "aws_apigatewayv2_route" "properties_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /properties"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "properties_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /properties"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "properties_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /properties/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "properties_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /properties/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "properties_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /properties/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# Reservations Routes
resource "aws_apigatewayv2_route" "reservations_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /reservations"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "reservations_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /reservations"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "reservations_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /reservations/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "reservations_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /reservations/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "reservations_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /reservations/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# Guests Routes
resource "aws_apigatewayv2_route" "guests_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /guests"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "guests_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /guests"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "guests_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /guests/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "guests_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /guests/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "guests_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /guests/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# Messages Routes
resource "aws_apigatewayv2_route" "messages_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /messages"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "messages_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /messages"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "messages_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /messages/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "messages_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /messages/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "messages_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /messages/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# Tasks Routes
resource "aws_apigatewayv2_route" "tasks_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /tasks"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "tasks_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /tasks"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "tasks_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /tasks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "tasks_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /tasks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "tasks_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /tasks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# Staff Routes
resource "aws_apigatewayv2_route" "staff_list" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /staff"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "staff_create" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "POST /staff"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "staff_get" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "GET /staff/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "staff_update" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "PUT /staff/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

resource "aws_apigatewayv2_route" "staff_delete" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "DELETE /staff/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# OPTIONS route for CORS preflight
resource "aws_apigatewayv2_route" "hai_options" {
  api_id    = aws_apigatewayv2_api.hai_api.id
  route_key = "OPTIONS /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.hai_lambda.id}"
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "hai_api_gateway" {
  name              = "/aws/apigateway/${local.normalized_prefix}-hai-api"
  retention_in_days = 14
  tags              = local.tags
}

# Default Stage
resource "aws_apigatewayv2_stage" "hai_default" {
  api_id      = aws_apigatewayv2_api.hai_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.hai_api_gateway.arn
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
    })
  }

  tags = local.tags
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "hai_api_gateway" {
  statement_id  = "AllowHAIAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hai_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.hai_api.execution_arn}/*/*"
}
