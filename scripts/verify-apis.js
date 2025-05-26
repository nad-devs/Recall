#!/usr/bin/env node

/**
 * API Verification Script for Recall
 * Tests all API endpoints to ensure they work properly
 */

const http = require('http');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET', data = null, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI(name, url, method = 'GET', data = null, expectedStatus = 200) {
  try {
    log(`Testing ${name}...`, 'blue');
    const result = await makeRequest(url, method, data);
    
    if (result.status === expectedStatus) {
      log(`✅ ${name}: OK (${result.status})`, 'green');
      return true;
    } else {
      log(`❌ ${name}: Failed (${result.status})`, 'red');
      if (result.data && typeof result.data === 'object' && result.data.error) {
        console.log(`   Error: ${result.data.error}`);
      }
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Error - ${error.message}`, 'red');
    return false;
  }
}

async function runAPIVerification() {
  log('🔍 Starting API Verification for Recall', 'blue');
  log('=' * 50, 'blue');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const tests = [
    // Core API endpoints
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET',
      expected: 200
    },
    {
      name: 'Conversations API (GET)',
      url: `${baseUrl}/api/conversations`,
      method: 'GET',
      expected: 200
    },
    {
      name: 'Concepts API (GET)',
      url: `${baseUrl}/api/concepts`,
      method: 'GET',
      expected: 200
    },
    {
      name: 'Categories API (GET)',
      url: `${baseUrl}/api/categories`,
      method: 'GET',
      expected: 200
    },
    // Test concept extraction with sample data
    {
      name: 'Concept Extraction API',
      url: `${baseUrl}/api/extract-concepts`,
      method: 'POST',
      data: {
        conversation_text: "Hash tables are data structures that provide O(1) average case lookup time."
      },
      expected: 200
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await testAPI(
      test.name, 
      test.url, 
      test.method, 
      test.data, 
      test.expected
    );
    if (success) passed++;
    console.log(''); // Empty line for readability
  }

  log('=' * 50, 'blue');
  log(`API Verification Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('🎉 All API endpoints are working! Ready for open source release.', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some API endpoints failed. Please check the issues above.', 'yellow');
    log('💡 Make sure the development server is running: npm run dev', 'blue');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Recall API Verification Script

Usage: node scripts/verify-apis.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  BASE_URL       Frontend URL (default: http://localhost:3000)

Examples:
  node scripts/verify-apis.js
  BASE_URL=https://myapp.com node scripts/verify-apis.js
`);
  process.exit(0);
}

// Run the verification
runAPIVerification().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
}); 