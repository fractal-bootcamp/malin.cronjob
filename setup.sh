#!/bin/bash

# Update package manager
sudo yum update -y

# Install curl and other basic tools
sudo yum install -y curl unzip git

# Install Node.js (if you prefer Node.js over Bun)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install TypeScript globally
npm install -g typescript ts-node

# Create project directory
mkdir -p ~/email-cronjob
cd ~/email-cronjob

# Initialize package.json
bun init -y

# Install project dependencies
bun add node-mailjet @types/node typescript
