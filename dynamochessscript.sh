#!/bin/bash

# Update and upgrade system
echo "Updating and upgrading the system..."
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Node.js
echo "Installing Node.js..."
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
node -v
npm -v
npm i
# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install NGINX
echo "Installing NGINX..."
sudo apt install -y nginx

# Set up NGINX configuration
echo "Configuring NGINX..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name chess.dynamochess.in;

    location / {
        proxy_pass http://localhost:8080; # Change the port if your app runs on a different one
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Check and reload NGINX
echo "Testing and reloading NGINX configuration..."
sudo nginx -t && sudo nginx -s reload
sudo service nginx restart

# Install Certbot for SSL
echo "Installing Certbot for SSL..."
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:certbot/certbot
sudo apt-get update -y
sudo apt-get install -y python3-certbot-nginx

# Obtain SSL certificates
echo "Obtaining SSL certificates..."
sudo certbot --nginx -d chess.dynamochess.in  --non-interactive --agree-tos --email md.imtiyazalam9876@gmail.com

# Set up Certbot auto-renewal
echo "Setting up Certbot auto-renewal..."
sudo certbot renew --dry-run

# Display deployment summary
echo "Setup complete!"
