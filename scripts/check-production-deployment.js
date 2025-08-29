/**
 * CHECK PRODUCTION DEPLOYMENT STATUS
 * Diagnoses CORS and API connectivity issues
 */

const https = require('https');
const http = require('http');

async function checkAPIEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https://') ? https : http;

    const req = protocol.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          corsHeaders: {
            'access-control-allow-origin': res.headers['access-control-allow-origin'],
            'access-control-allow-methods': res.headers['access-control-allow-methods'],
            'access-control-allow-headers': res.headers['access-control-allow-headers']
          }
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        error: err.message,
        code: err.code
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: 'Timeout after 5 seconds' });
    });

    req.end();
  });
}

async function checkDeploymentStatus() {
  console.log('🔍 CHECKING PRODUCTION DEPLOYMENT STATUS');
  console.log('==========================================');

  const endpoints = [
    {
      name: 'Production API',
      url: 'https://api.choptym.com/health',
      expectedStatus: 200
    },
    {
      name: 'Production API (with CORS headers)',
      url: 'https://api.choptym.com/api/dishes',
      expectedStatus: 200
    },
    {
      name: 'Local API (for comparison)',
      url: 'http://localhost:3001/health',
      expectedStatus: 200
    }
  ];

  console.log('\n🌐 CHECKING API ENDPOINTS:');
  console.log('==========================');

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);

    try {
      const result = await checkAPIEndpoint(endpoint.url);

      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
        if (endpoint.url.includes('localhost')) {
          console.log('   💡 Local server may not be running');
        }
      } else {
        console.log(`   ✅ Status: ${result.status}`);

        if (result.corsHeaders['access-control-allow-origin']) {
          console.log(`   ✅ CORS Origin: ${result.corsHeaders['access-control-allow-origin']}`);
        } else {
          console.log('   ⚠️  No CORS headers found');
        }

        if (result.data) {
          console.log(`   📄 Response: ${result.data}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }

  console.log('\n🔧 RECOMMENDED FIXES:');
  console.log('====================');

  console.log('\n1. 🖥️  SERVER CONFIGURATION:');
  console.log('   • Ensure server is using production environment');
  console.log('   • Command: NODE_ENV=production npm run server');
  console.log('   • Or deploy to production server (Railway, Vercel, etc.)');

  console.log('\n2. 🌐 CORS CONFIGURATION:');
  console.log('   • Update CORS_ORIGIN in server/.env.production');
  console.log('   • Include: https://choptym.com, https://www.choptym.com');
  console.log('   • Current: CORS_ORIGIN=https://choptym.com,https://www.choptym.com,http://localhost:3000,http://localhost:8080');

  console.log('\n3. 🚀 DEPLOYMENT OPTIONS:');
  console.log('   • Railway: railway deploy');
  console.log('   • Vercel: vercel --prod');
  console.log('   • Docker: docker-compose up -d');
  console.log('   • Manual: npm run build:prod && serve dist');

  console.log('\n4. 🧪 TESTING:');
  console.log('   • Test API: curl https://api.choptym.com/health');
  console.log('   • Test CORS: curl -H "Origin: https://choptym.com" https://api.choptym.com/api/dishes');
  console.log('   • Browser test: Open https://choptym.com and check console');

  console.log('\n📞 SUPPORT:');
  console.log('===========');
  console.log('• If server is not deployed: Deploy it first');
  console.log('• If CORS still fails: Check server logs');
  console.log('• If API returns 404: Check server routing');
  console.log('• For help: Check server/.env.production configuration');
}

// Run the check
checkDeploymentStatus().catch(console.error);