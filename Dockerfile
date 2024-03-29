# Build stage
FROM node:16.14.2-bullseye
# Install NodeJs dependencies
WORKDIR /build
COPY package.json ./
COPY package-lock.json ./
RUN npm install
RUN npm install -g pm2
# Build package
COPY . .
RUN npm run build
# Start the server with 16 instances
ENV NODE_ENV=production
EXPOSE 19999
ENTRYPOINT ["pm2-runtime", "-i", "16", "dist/main.js"] 