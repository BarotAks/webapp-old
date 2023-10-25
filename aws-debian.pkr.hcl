# aws-debian.pkr.hcl
variable "aws_profile" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami_owner" {
  type    = string
  default = "547336217625"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}


variable "github_workspace" {
  type    = string
  default = ""
}

variable "source_ami" {
  type    = string
  default = "ami-0bde774ae2812b32f"
}



locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "~> 1"
    }
  }
}

source "amazon-ebs" "webapp" {
  profile         = var.aws_profile
  ami_name        = "webapp-ami-${local.timestamp}"
  ami_description = "AMI for webapp"
  instance_type   = var.instance_type
  region          = var.region
  source_ami      = var.source_ami
  ssh_username    = var.ssh_username
  ami_users       = ["547336217625", "711372696784"] # Replace with the DEV, DEMO AWS Account ID
}

build {
  sources = ["source.amazon-ebs.webapp"]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    script = "./webapp.sh"
  }
}
