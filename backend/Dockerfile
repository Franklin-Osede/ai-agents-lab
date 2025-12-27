# Base Image
FROM node:20-alpine

# Workdir
WORKDIR /usr/src/app

# Dependencies
COPY package*.json ./
RUN npm install

# Source Code
COPY . .

# Build
RUN npm run build

# Start
CMD ["node", "dist/main"]
