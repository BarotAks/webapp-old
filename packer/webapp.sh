#!/bin/bash

set -e  # This will cause the script to exit if any command returns a non-zero exit code

# Update the system
echo "Updating the system"
sudo apt update -y
sudo apt upgrade -y

# Install Node.js
echo "Installing Node.js"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install unzip if not installed
echo "Installing unzip"
sudo apt-get install unzip -y

# Unzip the web application
echo "Unzipping the web application"
unzip webapp.zip -d webapp

# Navigate to the webapp directory and install node modules
echo "Installing node modules"
cd webapp
npm install

# Copy the systemd service file and start the service
echo "Setting up and starting the webapp service"
sudo cp /home/admin/webapp/packer/webapp.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl start webapp.service
sudo systemctl enable webapp.service


echo "Script executed successfully!"



