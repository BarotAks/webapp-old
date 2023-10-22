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
      "sudo apt -y install nodejs npm mariadb-server mariadb-client zip unzip",
      "sudo systemctl start mariadb",
      "sudo systemctl enable mariadb",
      "sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'",
      "sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e \"GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'"


    ]
  }

  provisioner "file" {
    source      = "./"
    destination = "/home/admin/webapp.zip"
  }

  provisioner "shell" {
    inline = [
      "ls -l /home/admin",            # Check if the directory exists
      "ls -l /home/admin/webapp.zip", # Check if the file is copied successfully
      "cd /home/admin",
      "unzip webapp.zip",
      "ls -l /home/admin", # List the contents after unzipping
      "npm install",
      "sudo apt-get install -y unzip", # Added -y flag for non-interactive installation
      "sudo rm -rf /var/cache/apt/archives",
    ]
  }

  provisioner "shell" {
    inline = [
      "ls -l /home/admin", # List contents before cleaning
      "sudo apt clean",
      "sudo rm -rf /var/lib/apt/lists/*",
      "ls -l /home/admin", # List contents after cleaning
    ]
  }
}