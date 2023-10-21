variable "aws_profile" {
  type    = string
  default = "dev"
}

variable "webapp_archive" {
  type    = string
  default = "webapp.tar.gz"
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
      "sudo apt -y install nodejs npm mariadb-server mariadb-client tar gzip",
      "sudo systemctl start mariadb",
      "sudo systemctl enable mariadb",
      "sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'",
      "sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e \"GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';\"",
      "sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'",
      "echo 'Current Directory: $(pwd)'",                                               # Print current directory
      "echo 'Contents of the Directory: $(ls)'",                                        # List contents of the directory
      "echo 'Path to tar file: /home/runner/work/webapp/webapp.tar.gz'",                # Print path to tar file
      "if [ -f /home/runner/work/webapp/webapp.tar.gz ]; then",                         # Check if the file exists
      "  tar -xzf /home/runner/work/webapp/webapp.tar.gz -C /home/runner/work/webapp/", # Unzip and extract the TAR archive in the current directory
      "else",
      "  echo 'Error: Tar file not found!'", # Print error message if the file doesn't exist
      "  exit 1",                            # Exit with non-zero status to indicate failure
      "fi",
      "cd /home/runner/work/webapp",
      "npm install" # Install dependencies
    ]
  }


  provisioner "shell" {
    inline = [
      "sudo apt clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}