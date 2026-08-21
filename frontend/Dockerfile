FROM node:24-bookworm

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
