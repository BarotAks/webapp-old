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

  provisioner "shell" {
    inline = [
      "sudo mkdir /home/admin/webapp",
      "unzip webapp.zip -d /home/admin/webapp", # Unzip the uploaded ZIP file
      "sudo chown -R admin:admin /home/admin/webapp",
      "cd /home/admin/webapp",
      "npm install",
      "npm run build",
      "sudo rm -rf /var/cache/apt/archives",
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}
