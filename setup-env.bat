@echo off
echo Creating .env.local file for AutoFi Nexus...
cd frontend
echo # AutoFi Nexus Environment Variables > .env.local
echo VITE_VAULT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 >> .env.local
echo VITE_RPC_URL=http://127.0.0.1:8545 >> .env.local
echo.
echo ✅ .env.local file created successfully!
echo.
echo Now restart your frontend server:
echo npm run dev
echo.
pause
