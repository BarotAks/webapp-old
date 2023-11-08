#!/bin/bash

# Exit immediately if any command exits with a non-zero status (error)
set -e

# Update the system packages
echo "Updating the system"
sudo apt update -y
sudo apt upgrade -y

# Install Node.js and npm
echo "Installing Node.js"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install unzip utility if not already installed
echo "Installing unzip"
sudo apt-get install unzip -y

# Unzip the web application package to the appropriate directory
echo "Unzipping the web application"
unzip /home/admin/webapp.zip -d /home/admin/webapp

# Navigate to the web application directory and install Node.js dependencies
echo "Installing node modules"
cd /home/admin/webapp
npm install

# Copy the CloudWatch agent configuration file to the appropriate location
echo "Copying CloudWatch configuration"
sudo cp /tmp/cloudwatch-config.json /etc/amazon/amazon-cloudwatch-agent.json

# Download and install the CloudWatch agent package
echo "Installing and configuring CloudWatch agent"
wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
rm -f ./amazon-cloudwatch-agent.deb

# Start the CloudWatch agent
echo "Starting CloudWatch agent"
sudo systemctl start amazon-cloudwatch-agent

# Enable the CloudWatch agent to start on boot
echo "Enabling CloudWatch agent to start on boot"
sudo systemctl enable amazon-cloudwatch-agent

# Copy the systemd service file and start the web application service
echo "Setting up and starting the webapp service"
sudo cp /tmp/webapp.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl start webapp.service
sudo systemctl enable webapp.service

echo "Script executed successfully!"
