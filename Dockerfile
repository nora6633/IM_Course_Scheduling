# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Create necessary directories and copy files
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY courses_data/ ./courses_data/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of working directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the application
CMD ["node", "backend/server.js"]
