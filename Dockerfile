FROM node:22-alpine3.20

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if exists) to the container
COPY package.json package-lock.json* /app/

# Install both production and development dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . /app/

# Expose the port that the NestJS application runs on (default is 3000)
EXPOSE 3000

# Run the NestJS app in development mode using the start:dev script
RUN npm run build 

# Ensure that the app is built before starting the dev server
CMD ["npm", "run", "start"]
