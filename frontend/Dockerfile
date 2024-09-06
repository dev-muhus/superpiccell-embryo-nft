FROM node:18-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
  openssl \
  xz-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /frontend

# Install Next.js globally
RUN npm install --global next@latest

# Copy package.json and package-lock.json  
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
