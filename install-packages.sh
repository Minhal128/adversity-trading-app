#!/bin/bash

# ATC Frontend Package Installation Script
# Run this script in the frontend directory

echo "🚀 Installing required packages for ATC Frontend-Backend Integration..."
echo ""

echo "📦 Installing axios..."
npm install axios

echo "📦 Installing @react-native-async-storage/async-storage..."
npm install @react-native-async-storage/async-storage

echo "📦 Installing socket.io-client..."
npm install socket.io-client

echo ""
echo "✅ All packages installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update your App.tsx to include AuthProvider"
echo "2. Test the authentication flow"
echo "3. Check INTEGRATION_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Your frontend is now ready to connect with the backend!"
