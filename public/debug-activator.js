// Debug Activator Script for Category Operations Analysis
// Copy and paste this into your browser console to enable comprehensive debugging

console.log('🔧 Activating Enhanced Debug Mode for Category Operations...');

// Enable debug mode in localStorage
try {
  localStorage.setItem('debug', 'true');
  localStorage.setItem('debug_mode', 'true');
  console.log('✅ Debug mode enabled in localStorage');
} catch (e) {
  console.warn('⚠️ Could not save to localStorage:', e);
}

// Add debug query parameter to URL
if (!window.location.search.includes('debug=true')) {
  const url = new URL(window.location);
  url.searchParams.set('debug', 'true');
  console.log('🔄 Reloading with debug parameter...');
  window.location.href = url.toString();
} else {
  console.log('✅ Debug parameter already present');
}

// Add comprehensive event loop monitoring
let eventLoopChecks = 0;
const startEventLoopMonitoring = () => {
  const checkEventLoop = () => {
    const start = performance.now();
    setTimeout(() => {
      const delay = performance.now() - start;
      eventLoopChecks++;
      
      if (delay > 100) {
        console.error(`🔴 CRITICAL EVENT LOOP DELAY: ${delay.toFixed(2)}ms (check #${eventLoopChecks})`);
      } else if (delay > 50) {
        console.warn(`🟡 Event loop delay: ${delay.toFixed(2)}ms (check #${eventLoopChecks})`);
      } else if (eventLoopChecks % 50 === 0) {
        console.log(`🟢 Event loop OK: ${delay.toFixed(2)}ms (check #${eventLoopChecks})`);
      }
    }, 0);
  };
  
  // Check every 2 seconds
  setInterval(checkEventLoop, 2000);
  console.log('🔄 Event loop monitoring started');
};

// Monitor for stuck operations
const monitorStuckOperations = () => {
  const checkStuckOps = () => {
    if (window.debugLogger) {
      const stuckOps = window.debugLogger.getStuckOperations();
      if (stuckOps.length > 0) {
        console.error('🚨 STUCK OPERATIONS DETECTED:', stuckOps);
      }
    }
  };
  
  setInterval(checkStuckOps, 5000);
  console.log('🔍 Stuck operation monitoring started');
};

// Add global error tracking for category operations
window.addEventListener('error', (event) => {
  if (event.error && event.error.stack && 
      (event.error.stack.includes('Category') || 
       event.error.stack.includes('Dialog') ||
       event.error.stack.includes('reset'))) {
    console.error('🔥 CATEGORY OPERATION ERROR DETECTED:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      error: event.error,
      stack: event.error.stack
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && 
      (JSON.stringify(event.reason).includes('category') ||
       JSON.stringify(event.reason).includes('dialog') ||
       JSON.stringify(event.reason).includes('reset'))) {
    console.error('🔥 CATEGORY OPERATION PROMISE REJECTION:', event.reason);
  }
});

// Start monitoring
setTimeout(() => {
  startEventLoopMonitoring();
  monitorStuckOperations();
  
  console.log(`
🔍 ENHANCED DEBUG MODE ACTIVATED 🔍

Key debugging features enabled:
📊 State transition tracking
🔄 Event loop monitoring  
⏱️ Async operation tracking
📍 Stack trace logging
🔲 Dialog transition tracking
🚨 Stuck operation detection

To view debug reports:
- debugLogger.exportToConsole()
- debugLogger.generateReport()

To disable debug mode:
- localStorage.removeItem('debug')
- localStorage.removeItem('debug_mode')
- Remove ?debug=true from URL

Now try reproducing the freezing issue with:
1. Adding a subcategory
2. Canceling the operation
3. Moving concepts between categories
4. Canceling during concept transfer

Watch the console for detailed execution flow!
  `);
}, 1000);

console.log('🎯 Debug activator loaded. Monitoring will start in 1 second...'); 