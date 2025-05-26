#!/usr/bin/env node

/**
 * Health Check Script for Notes AI
 * Tests all health endpoints and basic functionality
 */

const https = require('https');
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

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
  });
}

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    log(`Testing ${name}...`, 'blue');
    const result = await makeRequest(url);
    
    if (result.status === expectedStatus) {
      log(`✅ ${name}: OK (${result.status})`, 'green');
      if (result.data && typeof result.data === 'object') {
        console.log(`   Status: ${result.data.status || 'unknown'}`);
        if (result.data.database) {
          console.log(`   Database: ${result.data.database}`);
        }
        if (result.data.extractionService) {
          console.log(`   Extraction Service: ${result.data.extractionService}`);
        }
      }
      return true;
    } else {
      log(`❌ ${name}: Failed (${result.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Error - ${error.message}`, 'red');
    return false;
  }
}

async function runHealthChecks() {
  log('🏥 Starting Health Checks for Notes AI', 'blue');
  log('=' * 50, 'blue');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';

  const tests = [
    {
      name: 'Frontend Health Check',
      url: `${baseUrl}/api/health`,
      expected: 200
    },
    {
      name: 'Python Service Health Check',
      url: `${pythonUrl}/api/v1/health`,
      expected: 200
    },
    {
      name: 'Concepts API',
      url: `${baseUrl}/api/concepts`,
      expected: 200
    },
    {
      name: 'Conversations API',
      url: `${baseUrl}/api/conversations`,
      expected: 200
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await testEndpoint(test.name, test.url, test.expected);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }

  log('=' * 50, 'blue');
  log(`Health Check Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('🎉 All health checks passed! System is ready.', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some health checks failed. Please review the issues above.', 'yellow');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Notes AI Health Check Script

Usage: node scripts/test-health.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  BASE_URL       Frontend URL (default: http://localhost:3000)
  PYTHON_URL     Python service URL (default: http://localhost:8000)

Examples:
  node scripts/test-health.js
  BASE_URL=https://myapp.com PYTHON_URL=https://api.myapp.com node scripts/test-health.js
`);
  process.exit(0);
}

// Run the health checks
runHealthChecks().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
}); 