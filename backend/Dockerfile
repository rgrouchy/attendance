# Use an official Node.js runtime as a base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your Express app listens on (default 3000)
EXPOSE 3000

# Command to run the server
CMD ["node", "server.js"]
