# Outputs for HAI API
output "hai_api_gateway_url" {
  description = "The URL of the HAI API Gateway"
  value       = aws_apigatewayv2_api.hai_api.api_endpoint
}

output "hai_dynamodb_table_name" {
  description = "The name of the HAI DynamoDB table"
  value       = aws_dynamodb_table.hai_data.name
}

output "hai_lambda_function_name" {
  description = "The name of the HAI API Lambda function"
  value       = aws_lambda_function.hai_api.function_name
}
