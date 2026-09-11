# ATC Frontend Package Installation
# Run this script in PowerShell from the frontend directory

Write-Host "🚀 Installing required packages for ATC Frontend-Backend Integration..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing axios..." -ForegroundColor Yellow
npm install axios

Write-Host "📦 Installing @react-native-async-storage/async-storage..." -ForegroundColor Yellow
npm install @react-native-async-storage/async-storage

Write-Host "📦 Installing socket.io-client..." -ForegroundColor Yellow
npm install socket.io-client

Write-Host ""
Write-Host "✅ All packages installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your App.tsx to include AuthProvider" -ForegroundColor White
Write-Host "2. Test the authentication flow" -ForegroundColor White
Write-Host "3. Check INTEGRATION_GUIDE.md for detailed instructions" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your frontend is now ready to connect with the backend!" -ForegroundColor Green
