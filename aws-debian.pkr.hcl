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



  source_ami   = "ami-06db4d78cb1d3bbf9"
  ssh_username = var.ssh_username
  ami_users    = ["547336217625", "711372696784"] # Replace with the DEV,DEMO AWS Account ID
}



build {
  sources = ["source.amazon-ebs.webapp"]




  provisioner "shell" {
    inline = [
      "sudo apt update",
      "sudo apt -y upgrade",
      "sudo apt -y install nodejs npm mariadb-server mariadb-client",
      "sudo systemctl start mariadb",
      "sudo systemctl enable mariadb",
      "sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'",
      "sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e \"GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'"


    ]
  }




  provisioner "file" {
    source      = "webapp.zip"
    destination = "/home/admin/webapp.zip"
  }



  provisioner "shell" {
    inline = [
      "sudo apt-get install unzip", # Making sure unzip is installed
      "cd /home/admin",
      "unzip webapp.zip", # Unzip the webapp.zip
      "npm install"       # Install dependencies
    ]
  }



  provisioner "shell" {
    inline = [
      "sudo apt clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}