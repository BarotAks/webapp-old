variable "aws_profile" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "source_ami_owner" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "ssh_username" {
  type = string
}

variable "source_ami" {
  type = string
}

variable "github_workspace" {
  type = string
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
  profile         = "${var.aws_profile}"
  ami_name        = "webapp-ami-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  ami_description = "AMI for webapp"
  instance_type   = "${var.instance_type}"
  region          = "${var.aws_region}"
  source_ami      = "${var.source_ami}"
  ssh_username    = "${var.ssh_username}"
  ami_users       = ["547336217625", "711372696784"] # Replace with the DEV, DEMO AWS Account ID
}

build {
  sources = ["source.amazon-ebs.webapp"]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip" # Upload to a temporary location
  }

  provisioner "shell" {
    script = "./packer/webapp.sh"
  }

}
