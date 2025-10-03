# Stage 1: Build the React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the app for production
RUN npm run build

# Stage 2: Serve the app with nginx
FROM nginx:stable-alpine

# Copy build output from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config to serve app under /attendance
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
