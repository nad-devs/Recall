import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { serverLogger } from '@/lib/server-logger';

export async function GET(request: NextRequest) {
  try {
    // Only work if debug mode is enabled
    if (!serverLogger.isDebugEnabled()) {
      return NextResponse.json({ 
        error: 'Debug mode is disabled',
        message: 'Set DEBUG_LOGGING=true or NODE_ENV=development to enable debug mode'
      }, { status: 403 });
    }

    // Generate server-side debug report
    const report = serverLogger.generateReport();
    const slowQueries = serverLogger.getSlowQueries(100); // Queries slower than 100ms
    const errorSummary = serverLogger.getErrorSummary();

    return NextResponse.json({
      report,
      slowQueries,
      errorSummary,
      timestamp: new Date().toISOString(),
      serverUptime: process.uptime(),
      debugEnabled: true
    });
  } catch (error) {
    console.error('Error generating debug report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate debug report',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only work if debug mode is enabled
    if (!serverLogger.isDebugEnabled()) {
      return NextResponse.json({ 
        error: 'Debug mode is disabled',
        message: 'Set DEBUG_LOGGING=true or NODE_ENV=development to enable debug mode'
      }, { status: 403 });
    }

    const { action } = await request.json();
    
    if (action === 'enable_logging') {
      // Enable debug logging
      serverLogger.enable();
      return NextResponse.json({ message: 'Debug logging enabled', debugEnabled: true });
    } else if (action === 'disable_logging') {
      // Disable debug logging
      serverLogger.disable();
      return NextResponse.json({ message: 'Debug logging disabled', debugEnabled: false });
    } else if (action === 'clear_logs') {
      // Clear the server logs (only in debug mode)
      serverLogger['events'] = [];
      return NextResponse.json({ message: 'Server logs cleared' });
    } else if (action === 'memory_info') {
      // Get memory usage information
      const memoryUsage = process.memoryUsage();
      return NextResponse.json({
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          arrayBuffers: `${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)}MB`
        },
        uptime: `${Math.round(process.uptime())}s`,
        debugEnabled: serverLogger.isDebugEnabled()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling debug action:', error);
    return NextResponse.json({ 
      error: 'Failed to handle debug action',
      details: error
    }, { status: 500 });
  }
} 