# Lambda Layer for Data Repositories
# Provides shared data access logic for both TypeScript and Python Lambda functions

# Build TypeScript layer
resource "null_resource" "data_repositories_nodejs_build" {
  triggers = {
    source_hash = sha1(join("", [
      for file in fileset("${path.module}/../backend/lambda-layers/data-repositories/nodejs", "**/*.ts") :
      filesha1("${path.module}/../backend/lambda-layers/data-repositories/nodejs/${file}")
    ]))
    package_json = filemd5("${path.module}/../backend/lambda-layers/data-repositories/nodejs/package.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend/lambda-layers/data-repositories/nodejs"
    command     = <<EOT
      npm install && \
      npm run build && \
      mkdir -p nodejs/node_modules && \
      cp -r node_modules/* nodejs/node_modules/ && \
      cp -r dist/* nodejs/ && \
      cp package.json nodejs/
    EOT
  }
}

# Archive TypeScript layer
data "archive_file" "data_repositories_nodejs_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda-layers/data-repositories/nodejs"
  output_path = "${path.module}/build/data-repositories-nodejs-layer.zip"
  excludes    = ["node_modules", "dist", "*.ts", "tsconfig.json", "package-lock.json"]

  depends_on = [null_resource.data_repositories_nodejs_build]
}

# TypeScript Lambda Layer
resource "aws_lambda_layer_version" "data_repositories_nodejs" {
  filename            = data.archive_file.data_repositories_nodejs_layer.output_path
  layer_name          = "${local.normalized_prefix}-data-repositories-nodejs"
  source_code_hash    = data.archive_file.data_repositories_nodejs_layer.output_base64sha256
  compatible_runtimes = ["nodejs20.x", "nodejs18.x"]
  description         = "Shared data repositories for HAI TypeScript Lambda functions"

  depends_on = [null_resource.data_repositories_nodejs_build]
}

# Outputs
output "data_repositories_nodejs_layer_arn" {
  value       = aws_lambda_layer_version.data_repositories_nodejs.arn
  description = "ARN of the Node.js data repositories Lambda layer"
}
