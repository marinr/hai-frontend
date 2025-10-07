variable "region" {
  type        = string
  description = "AWS region to deploy resources into"
  default     = "eu-central-1"
}

variable "project" {
  type        = string
  description = "Short identifier for the project"
  default     = "hai-frontend"
}

variable "environment" {
  type        = string
  description = "Deployment environment name (dev, staging, prod, etc.)"
  default     = "dev"
}

variable "web_bucket_name" {
  type        = string
  description = "Override name for the web content bucket. Leave null to auto-generate"
  default     = null
}

variable "web_build_path" {
  type        = string
  description = "Relative or absolute path to the folder containing built static assets"
  default     = "../web/dist"
}

variable "lambda_memory_size" {
  type        = number
  description = "Memory size in MB for the API Lambda function"
  default     = 512
}

variable "lambda_timeout" {
  type        = number
  description = "Timeout in seconds for the API Lambda function"
  default     = 10
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to created resources"
  default     = {}
}
