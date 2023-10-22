variable "aws_profile" {
  type    = string
  default = "dev2"
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
  profile       = var.aws_profile
  ami_name      = "webapp-ami-${local.timestamp}"
  instance_type = var.instance_type
  region        = var.region
  source_ami    = "ami-06db4d78cb1d3bbf9"
  ssh_username  = var.ssh_username
  ami_users     = ["547336217625", "711372696784"] # Replace with the DEV, DEMO AWS Account ID
}

build {
  sources = ["source.amazon-ebs.webapp"]

  # Update system and install packages
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt update",
      "sudo apt -y upgrade",
      "sudo apt -y install nodejs npm mariadb-server mariadb-client zip unzip"
    ]
  }

  provisioner "shell" {
    inline = [
      "zip -r webapp.zip .",  # Create a zip file of all files in the repository
      "chmod 755 webapp.zip", # Ensure correct permissions for the ZIP file
      "ls -l webapp.zip",     # List details of the created ZIP file
      "unzip -o webapp.zip",  # Unzip the webapp.zip
      "ls -l",                # List files in the installation directory after unzip
      "npm install"           # Install dependencies
    ]
  }

  # Clean up the system
  provisioner "shell" {
    inline = [
      "sudo apt clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}