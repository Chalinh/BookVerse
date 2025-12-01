# Combined Dockerfile for all backend services
FROM node:18

WORKDIR /app

# Copy all backend services
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY book-service ./book-service
COPY cart-service ./cart-service
COPY order-service ./order-service
COPY start-all.sh ./start-all.sh

# Install dependencies for each service
RUN cd api-gateway && npm install && cd .. \
    && cd auth-service && npm install && cd .. \
    && cd book-service && npm install && cd .. \
    && cd cart-service && npm install && cd .. \
    && cd order-service && npm install && cd ..

# Make the start script executable
RUN chmod +x start-all.sh

EXPOSE 3000 3001 3002 3003 3004

ENTRYPOINT ["./start-all.sh"]
