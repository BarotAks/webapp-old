# !/bin/bash

# export DEBIAN_FRONTEND=noninteractive

# # Update and upgrade packages
# sudo apt-get update
# sudo apt-get -y upgrade

# # Install required packages
# sudo apt-get -y install nodejs npm mariadb-server mariadb-client unzip

# # Start and enable MariaDB service
# sudo systemctl start mariadb
# sudo systemctl enable mariadb

# # Create webapp database and grant privileges to root user
# sudo mysql -u root -proot -e 'CREATE DATABASE webapp;'
# sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
# sudo mysql -u root -proot -e "GRANT ALL PRIVILEGES ON webapp.* TO 'root'@'localhost' IDENTIFIED BY 'root';"
# sudo mysql -u root -proot -e 'FLUSH PRIVILEGES;'

# # Prepare webapp deployment
# mkdir -p /home/admin/webapp || exit 1
# cd /home/admin/webapp || exit 1
# mv /tmp/webapp.zip /home/admin/webapp/webapp.zip || exit 1
# unzip webapp.zip || exit 1
# npm install || exit 1

# # Create .env file with environment variables
# {
#   echo "DB_HOST=localhost"
#   echo "DB_PORT=3306"
#   echo "DB_USER=root"
#   echo "DB_PASSWORD=root"
#   echo "DB_NAME=webapp"
# } >> .env

# # Clean up unnecessary packages and files
# sudo rm -rf /var/cache/apt/archives
# sudo apt-get clean
# sudo rm -rf /var/lib/apt/lists/*

# # Exit with success status
# exit 0
