FROM node:22.23.3-bookworm-slim

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run validate

CMD ["npm", "test"]
