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
  source_ami    = "ami-0bde774ae2812b32f"
  ssh_username  = var.ssh_username
  ami_users     = ["547336217625", "711372696784"] # Replace with the DEV, DEMO AWS Account ID
}

build {
  sources = ["source.amazon-ebs.webapp"]

  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt-get update",
      "sudo apt-get -y upgrade",
      "sudo apt-get -y install nodejs npm mariadb-server mariadb-client unzip",
      "sudo systemctl start mariadb",
      "sudo systemctl enable mariadb",
      "sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'",
      "sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e \"GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'"
    ]
  }

  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/webapp.zip" # Upload to a temporary location
  }

  provisioner "shell" {
    inline = [
      "mkdir -p /home/admin/webapp",                      # Create the destination directory if it doesn't exist
      "mv /tmp/webapp.zip /home/admin/webapp/webapp.zip", # Move the uploaded file to the correct location
      "cd /home/admin/webapp",                            # Change to the destination directory
      "unzip webapp.zip",                                 # Unzip the file inside the destination directory
      "npm install",
      "npm run build",
      "sudo rm -rf /var/cache/apt/archives",
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}
