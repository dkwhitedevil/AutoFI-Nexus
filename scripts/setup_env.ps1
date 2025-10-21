# AutoFi-Nexus Environment Setup Script (PowerShell)
# This script helps set up the development environment for AutoFi-Nexus

param(
    [switch]$SkipDependencies
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

Write-Host "🚀 AutoFi-Nexus Environment Setup" -ForegroundColor $Colors.White
Write-Host "=================================" -ForegroundColor $Colors.White
Write-Host ""

# Check if Node.js is installed
function Test-NodeJS {
    Write-Status "Checking Node.js installation..."
    
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        
        # Check if version is 18 or higher
        $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($nodeMajorVersion -ge 18) {
            Write-Success "Node.js version is compatible (18+)"
        } else {
            Write-Error "Node.js version $nodeVersion is not compatible. Please install Node.js 18 or higher."
            exit 1
        }
    } catch {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        Write-Status "Visit: https://nodejs.org/"
        exit 1
    }
}

# Check if npm is installed
function Test-NPM {
    Write-Status "Checking npm installation..."
    
    try {
        $npmVersion = npm --version
        Write-Success "npm is installed: $npmVersion"
    } catch {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
}

# Check if Git is installed
function Test-Git {
    Write-Status "Checking Git installation..."
    
    try {
        $gitVersion = git --version
        Write-Success "Git is installed: $gitVersion"
    } catch {
        Write-Error "Git is not installed. Please install Git."
        Write-Status "Visit: https://git-scm.com/"
        exit 1
    }
}

# Setup contracts directory
function Setup-Contracts {
    Write-Status "Setting up contracts directory..."
    
    if (Test-Path "contracts") {
        Set-Location "contracts"
        
        # Install dependencies
        if (-not $SkipDependencies) {
            Write-Status "Installing contract dependencies..."
            npm install
        }
        
        # Create .env file if it doesn't exist
        if (-not (Test-Path ".env")) {
            Write-Status "Creating .env file from template..."
            Copy-Item "env.example" ".env"
            Write-Warning "Please edit .env file with your configuration:"
            Write-Warning "  - Add your RPC URLs"
            Write-Warning "  - Add your private key (keep secure!)"
            Write-Warning "  - Add your API keys for contract verification"
        } else {
            Write-Success ".env file already exists"
        }
        
        # Compile contracts
        Write-Status "Compiling contracts..."
        npm run compile
        
        Write-Success "Contracts setup completed"
        Set-Location ".."
    } else {
        Write-Error "Contracts directory not found. Please run this script from the project root."
        exit 1
    }
}

# Check for MetaMask
function Test-MetaMask {
    Write-Status "Checking for MetaMask..."
    
    # Check if common browsers are installed
    $browsers = @("chrome", "firefox", "msedge")
    $browserFound = $false
    
    foreach ($browser in $browsers) {
        if (Get-Command $browser -ErrorAction SilentlyContinue) {
            $browserFound = $true
            break
        }
    }
    
    if ($browserFound) {
        Write-Warning "MetaMask browser extension recommended for testing:"
        Write-Warning "  - Install MetaMask extension in your browser"
        Write-Warning "  - Create a test account"
        Write-Warning "  - Add Sepolia testnet network"
        Write-Warning "  - Get test ETH from faucets"
    }
}

# Display next steps
function Show-NextSteps {
    Write-Host ""
    Write-Host "🎉 Environment setup completed!" -ForegroundColor $Colors.Green
    Write-Host "================================" -ForegroundColor $Colors.Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor $Colors.White
    Write-Host "1. Edit contracts\.env with your configuration"
    Write-Host "2. Start local Hardhat node:"
    Write-Host "   cd contracts && npm run node" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "3. Deploy contracts locally (in another terminal):"
    Write-Host "   cd contracts && npm run deploy:local" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "4. Run tests:"
    Write-Host "   cd contracts && npm test" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "5. Deploy to testnet:"
    Write-Host "   cd contracts && npm run deploy:sepolia" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor $Colors.White
    Write-Host "- Smart Contracts: contracts\README.md"
    Write-Host "- Architecture: docs\AutoFi_Architecture.md"
    Write-Host "- Phase 1 Spec: docs\Phase1_Spec.md"
    Write-Host ""
    Write-Host "🔗 Useful Commands:" -ForegroundColor $Colors.White
    Write-Host "- Compile contracts: npm run compile"
    Write-Host "- Run tests: npm test"
    Write-Host "- Deploy local: npm run deploy:local"
    Write-Host "- Deploy testnet: npm run deploy:sepolia"
    Write-Host "- Gas report: npm run gas-report"
    Write-Host ""
    Write-Host "⚠️  Security Notes:" -ForegroundColor $Colors.Yellow
    Write-Host "- Never commit your .env file to version control"
    Write-Host "- Use test accounts and testnet for development"
    Write-Host "- Keep your private keys secure"
    Write-Host ""
    Write-Host "🆘 Support:" -ForegroundColor $Colors.White
    Write-Host "- GitHub Issues: https://github.com/autofi-nexus/issues"
    Write-Host "- Documentation: https://docs.autofi-nexus.com"
    Write-Host "- Discord: https://discord.gg/autofi-nexus"
}

# Main execution
function Main {
    Write-Status "Starting AutoFi-Nexus environment setup..."
    Write-Host ""
    
    # Check prerequisites
    Test-NodeJS
    Test-NPM
    Test-Git
    Test-MetaMask
    
    Write-Host ""
    Write-Success "All prerequisites are satisfied!"
    Write-Host ""
    
    # Setup contracts
    Setup-Contracts
    
    # Show next steps
    Show-NextSteps
}

# Run main function
Main