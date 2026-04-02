# Stage 1: Build React + Vite app
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files first (to leverage Docker cache)
COPY package.json package-lock.json ./

# Install dependencies including devDependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]