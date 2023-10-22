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
      "sudo apt -y install nodejs npm mariadb-server mariadb-client zip unzip"
    ]
  }

  # Set up MySQL database
  provisioner "shell" {
    inline = [
      "sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'",
      "sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e \"GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo apt-get install zip", # Making sure zip is installed
      // "cd /home//webapp/repo", 
      "zip -r webapp.zip ." # Create a zip file of all files in the repository
    ]
  }




  provisioner "file" {
    source      = "./" # Source file is now the zip file in the current directory
    destination = "/home/admin/webapp/webapp.zip"
  }

  provisioner "shell" {
    inline = [
      "sudo apt-get install unzip", # Making sure unzip is installed
      "cd /home/admin/webapp",
      "unzip webapp.zip", # Unzip the webapp.zip
      "npm install"       # Install dependencies
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