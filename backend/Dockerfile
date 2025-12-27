# 1. Base Image (Lightweight Node)
FROM node:20-alpine As build

# 2. Workdir
WORKDIR /usr/src/app

# 3. Dependencies
# Copy package.json and lock file first to leverage caching
COPY package*.json ./
RUN npm install

# 4. Source Code
COPY . .

# 5. Build
RUN npm run build

# ---

# 6. Production Image
FROM node:20-alpine As production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=build /usr/src/app/dist ./dist

# 7. Start
CMD ["node", "dist/main"]
