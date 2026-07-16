# Base image Node.js ka latest stable version
FROM node:18-alpine

# App directory create karna
WORKDIR /usr/src/app

# Dependencies copy karna
COPY package*.json ./

# Packages install karna
RUN npm install

# Baaki saara code copy karna
COPY . .

# Bot ko run karna
CMD [ "npm", "start" ]
