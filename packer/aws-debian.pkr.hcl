# aws-debian.pkr.hcl
variable "aws_profile" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "us-east-1"
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
  ami_description = "AMI for CSYE6225"
  instance_type   = var.instance_type
  region          = var.region
  source_ami      = "ami-06db4d78cb1d3bbf9"
  ssh_username    = var.ssh_username
  ami_users       = ["547336217625", "711372696784"] # Replace with the DEV, DEMO AWS Account ID

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }


  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.webapp"]

  provisioner "file" {
    source      = "../webapp.zip"
    destination = "/home/admin/webapp.zip"
  }

  provisioner "file" {
    source      = "./webapp.service"
    destination = "/tmp/webapp.service"
  }

  provisioner "file" {
    source      = "./cloudwatch-config.json"
    destination = "/tmp/cloudwatch-config.json"
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1"
    ]
    script = "./webapp.sh"
  }

  provisioner "shell" {
    inline = [
      "sudo apt clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}
