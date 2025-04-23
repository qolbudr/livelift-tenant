#!/bin/bash
# This script deploys the application to a server.

# ask user to input db name, user and password
DB_NAME=""
DB_USER=""
DB_PASSWORD=""

read -p "Enter database name: " DB_NAME
read -p "Enter database user: " DB_USER
read -p "Enter database password: " DB_PASSWORD

cp .env.example .env

# replace the placeholders in .env file with user input
sed -i "s/DB_NAME/$DB_NAME/g" .env
sed -i "s/DB_USER/$DB_USER/g" .env
sed -i "s/DB_PASSWORD/$DB_PASSWORD/g" .env

export PATH="/www/server/nodejs/v22.14.0/bin/:$PATH"
npm install
npx prisma migrate deploy