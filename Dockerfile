# Use the official Node.js image as a base. Choose a version that is compatible with package.json.
FROM node:16

# Create and set the /app directory as the working directory.
WORKDIR /app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install project dependencies. Use npm install to install exact versions based on package-lock.json.
RUN npm install

# Copy the project source code. Use .dockerignore to exclude node_modules and other local-specific files.
COPY . .

# Command to be executed when the container starts. This starts a development server.
CMD ["tail", "-f", "/dev/null"]
