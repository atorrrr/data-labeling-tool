#!/bin/bash

# Exit on any error
set -e

# Prompt for necessary information
read -p "Enter the GitHub repository URL: " REPO_URL
read -p "Enter the desired installation directory: " INSTALL_DIR
read -p "Enter the desired port for the server (default 3000): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-3000}
read -p "Enter the Node.js version to use (e.g., 14.17.0): " NODE_VERSION

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y curl git sqlite3 nginx

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install Node.js and npm
nvm install $NODE_VERSION
nvm use $NODE_VERSION

# Verify installation
node --version
npm --version

# Clone the repository
git clone $REPO_URL $INSTALL_DIR
cd $INSTALL_DIR

# Setup server
cd server
npm install
cp .env.example .env
sed -i "s/PORT=.*/PORT=$SERVER_PORT/" .env

# Initialize the database
node initDb.js

# Setup client
cd ../client
npm install
npm run build

# Setup Nginx
sudo tee /etc/nginx/sites-available/data-labeling-tool << EOL
server {
    listen 80;
    server_name _;

    location / {
        root $INSTALL_DIR/client/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$SERVER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

sudo ln -s /etc/nginx/sites-available/data-labeling-tool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set correct permissions
sudo chown -R www-data:www-data $INSTALL_DIR
sudo find $INSTALL_DIR -type d -exec chmod 755 {} \;
sudo find $INSTALL_DIR -type f -exec chmod 644 {} \;

# Create a systemd service for the Node.js server
sudo tee /etc/systemd/system/data-labeling-tool.service << EOL
[Unit]
Description=Data Labeling Tool Server
After=network.target

[Service]
ExecStart=$NVM_DIR/nvm-exec node $INSTALL_DIR/server/server.js
Restart=always
User=www-data
Environment=NODE_ENV=production
WorkingDirectory=$INSTALL_DIR/server
Environment=PATH=/usr/bin:/usr/local/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin
Environment=NODE_VERSION=$NODE_VERSION

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
sudo systemctl enable data-labeling-tool
sudo systemctl start data-labeling-tool

echo "Setup complete! Your application should now be running."
echo "You can access it at http://your-server-ip"
