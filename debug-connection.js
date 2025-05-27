#!/usr/bin/env node

/**
 * Debug script to test connections between frontend and backend
 */

const http = require('http');
const https = require('https');

console.log('🔍 Debugging Shopify App Connections...\n');

// Test backend connection
function testBackend() {
  return new Promise((resolve) => {
    console.log('1️⃣ Testing Backend Connection...');
    
    const req = http.get('http://127.0.0.1:8001/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Backend Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test specific endpoints
async function testEndpoints() {
  console.log('\n2️⃣ Testing API Endpoints...');
  
  const endpoints = [
    '/rewards/',
    '/tiers/',
    '/loyalty/profiles/customer123/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:8001${endpoint}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`✅ ${endpoint}: OK`);
            } else {
              console.log(`⚠️  ${endpoint}: ${res.statusCode}`);
            }
            resolve();
          });
        });
        
        req.on('error', (err) => {
          console.log(`❌ ${endpoint}: ${err.message}`);
          resolve();
        });
        
        req.setTimeout(3000, () => {
          console.log(`❌ ${endpoint}: Timeout`);
          req.destroy();
          resolve();
        });
      });
    } catch (err) {
      console.log(`❌ ${endpoint}: ${err.message}`);
    }
  }
}

// Check environment
function checkEnvironment() {
  console.log('\n3️⃣ Checking Environment...');
  
  const requiredEnvVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'BACKEND_URL'
  ];
  
  // Try to read .env.local
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, 'web', '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('📄 Found .env.local file');
      
      requiredEnvVars.forEach(varName => {
        const match = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'));
        if (match && match[1] !== 'your_api_key_here' && match[1] !== 'your_api_secret_here') {
          console.log(`✅ ${varName}: Set`);
        } else {
          console.log(`❌ ${varName}: Not set or placeholder`);
        }
      });
    } else {
      console.log('❌ .env.local file not found');
    }
  } catch (err) {
    console.log('❌ Error reading environment:', err.message);
  }
}

// Check ports
function checkPorts() {
  console.log('\n4️⃣ Checking Port Usage...');
  
  const { exec } = require('child_process');
  
  exec('lsof -i :8001', (error, stdout, stderr) => {
    if (stdout) {
      console.log('🔌 Port 8001 usage:');
      console.log(stdout);
    } else {
      console.log('❌ Port 8001: Not in use');
    }
  });
  
  exec('lsof -i :3000', (error, stdout, stderr) => {
    if (stdout) {
      console.log('🔌 Port 3000 usage:');
      console.log(stdout);
    } else {
      console.log('ℹ️  Port 3000: Available');
    }
  });
}

// Run all tests
async function runDiagnostics() {
  const backendOk = await testBackend();
  
  if (backendOk) {
    await testEndpoints();
  }
  
  checkEnvironment();
  checkPorts();
  
  console.log('\n🎯 Next Steps:');
  if (!backendOk) {
    console.log('1. Start the backend server:');
    console.log('   cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload');
  }
  
  console.log('2. Get your Shopify API secret from:');
  console.log('   https://partners.shopify.com');
  
  console.log('3. Update web/.env.local with your API secret');
  
  console.log('4. Restart Shopify CLI:');
  console.log('   cd web && shopify app dev');
}

runDiagnostics().catch(console.error);
