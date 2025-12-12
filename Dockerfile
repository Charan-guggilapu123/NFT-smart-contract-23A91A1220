# Use Foundry official image
FROM ghcr.io/foundry-rs/foundry:latest

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN forge install

# Default command: run tests
CMD ["forge", "test", "-vvv"]
