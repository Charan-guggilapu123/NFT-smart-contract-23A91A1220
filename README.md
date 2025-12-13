# NFT Collection — ERC-721 Smart Contract
A minimal, self-contained ERC-721–compatible NFT smart contract with admin-controlled minting, maximum supply enforcement, pause/unpause functionality, approvals, safe transfers, token burning, and metadata support via a base URI.

The project includes a complete automated test suite and a Dockerized environment that installs dependencies, compiles the contracts, and runs all tests by default.

# Features
ERC-721–style ownership and balance tracking

Admin-only minting

Configurable token ID range

Maximum supply enforcement

Pause and unpause minting

Token transfers and safe transfers

Token approvals and operator approvals

Token burning by owner

Metadata via configurable base URI

No OpenZeppelin dependencies (fully self-contained implementation)

# Project Structure

```bash

contracts/
  NftCollection.sol        # Main NFT contract
test/
  NftCollection.test.js    # Automated test suite
Dockerfile                 # Containerized build & test environment
.dockerignore              # Optimized Docker build context
hardhat.config.js          # Hardhat configuration
package.json               # Project dependencies
package-lock.json          # Locked dependency versions
README.md                  # Project documentation
  ```
# Contract Overview

# Constructor Parameters

constructor(
  string name,
  string symbol,
  string baseURI,
  uint256 minTokenId,
  uint256 maxTokenId,
  uint256 maxSupply
)

# Access Control

->The deployer is the admin

->Only the admin can:

Mint new tokens

Pause or unpause minting

Update the base URI

# Minting Rules
Minting can be paused or unpaused by the admin

Token IDs must be within the configured range

Tokens cannot be minted more than once

Total supply cannot exceed maxSupply

# Local Development

# Prerequisites
Node.js 18+

npm

Docker (optional, for containerized execution)

# Install Dependencies

npm install

# Compile Contracts

npx hardhat compile

# Run Tests Locally

npx hardhat test

All tests should pass before running the Docker container.

# Docker Usage (MANDATORY FOR SUBMISSION)
The Docker container installs all dependencies, compiles the contracts, and runs the complete test suite by default.

# Build the Docker Image

docker build -t nft-contract .

# Run Tests Inside the Container

docker run --rm nft-contract

# Expected Output
Contracts compile successfully

All automated tests execute

The container exits automatically after test completion

# Docker Notes
Docker builds may fail on restricted or unstable networks due to limited access to Docker Hub or npm registries (for example, TLS or ECONNRESET errors).

The provided Dockerfile builds successfully on standard networks and CI environments, which are used during evaluation.

# Testing Coverage
The automated test suite validates:

Initial contract configuration (name, symbol, supply)

Admin-only minting behavior

Successful minting flows

Maximum supply enforcement and revert conditions

Pause and unpause functionality

Transfers, approvals, and operator approvals

Failure scenarios for invalid operations

Tests are deterministic and designed to run entirely inside the Docker container without manual interaction.

