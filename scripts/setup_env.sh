#!/bin/bash

# AutoFi-Nexus Environment Setup Script
# This script helps set up the development environment for AutoFi-Nexus

set -e

echo "🚀 AutoFi-Nexus Environment Setup"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js version is compatible (18+)"
        else
            print_error "Node.js version $NODE_VERSION is not compatible. Please install Node.js 18 or higher."
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Check if Git is installed
check_git() {
    print_status "Checking Git installation..."
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git is installed: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git."
        print_status "Visit: https://git-scm.com/"
        exit 1
    fi
}

# Setup contracts directory
setup_contracts() {
    print_status "Setting up contracts directory..."
    
    if [ -d "contracts" ]; then
        cd contracts
        
        # Install dependencies
        print_status "Installing contract dependencies..."
        npm install
        
        # Create .env file if it doesn't exist
        if [ ! -f ".env" ]; then
            print_status "Creating .env file from template..."
            cp env.example .env
            print_warning "Please edit .env file with your configuration:"
            print_warning "  - Add your RPC URLs"
            print_warning "  - Add your private key (keep secure!)"
            print_warning "  - Add your API keys for contract verification"
        else
            print_success ".env file already exists"
        fi
        
        # Compile contracts
        print_status "Compiling contracts..."
        npm run compile
        
        print_success "Contracts setup completed"
        cd ..
    else
        print_error "Contracts directory not found. Please run this script from the project root."
        exit 1
    fi
}

# Check for MetaMask
check_metamask() {
    print_status "Checking for MetaMask..."
    
    # Check if running in browser environment
    if command -v google-chrome &> /dev/null || command -v firefox &> /dev/null; then
        print_warning "MetaMask browser extension recommended for testing:"
        print_warning "  - Install MetaMask extension in your browser"
        print_warning "  - Create a test account"
        print_warning "  - Add Sepolia testnet network"
        print_warning "  - Get test ETH from faucets"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Environment setup completed!"
    echo "================================"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit contracts/.env with your configuration"
    echo "2. Start local Hardhat node:"
    echo "   cd contracts && npm run node"
    echo ""
    echo "3. Deploy contracts locally (in another terminal):"
    echo "   cd contracts && npm run deploy:local"
    echo ""
    echo "4. Run tests:"
    echo "   cd contracts && npm test"
    echo ""
    echo "5. Deploy to testnet:"
    echo "   cd contracts && npm run deploy:sepolia"
    echo ""
    echo "📚 Documentation:"
    echo "- Smart Contracts: contracts/README.md"
    echo "- Architecture: docs/AutoFi_Architecture.md"
    echo "- Phase 1 Spec: docs/Phase1_Spec.md"
    echo ""
    echo "🔗 Useful Commands:"
    echo "- Compile contracts: npm run compile"
    echo "- Run tests: npm test"
    echo "- Deploy local: npm run deploy:local"
    echo "- Deploy testnet: npm run deploy:sepolia"
    echo "- Gas report: npm run gas-report"
    echo ""
    echo "⚠️  Security Notes:"
    echo "- Never commit your .env file to version control"
    echo "- Use test accounts and testnet for development"
    echo "- Keep your private keys secure"
    echo ""
    echo "🆘 Support:"
    echo "- GitHub Issues: https://github.com/autofi-nexus/issues"
    echo "- Documentation: https://docs.autofi-nexus.com"
    echo "- Discord: https://discord.gg/autofi-nexus"
}

# Main execution
main() {
    echo "Starting AutoFi-Nexus environment setup..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_npm
    check_git
    check_metamask
    
    echo ""
    print_status "All prerequisites are satisfied!"
    echo ""
    
    # Setup contracts
    setup_contracts
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"