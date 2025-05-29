interface ServerLogEvent {
  timestamp: number
  type: 'DATABASE' | 'API' | 'ERROR' | 'PERFORMANCE' | 'AUTH'
  endpoint?: string
  method?: string
  duration?: number
  error?: any
  userId?: string
  details?: any
  query?: string
}

class ServerLogger {
  private events: ServerLogEvent[] = []
  private maxEvents = 500
  private isEnabled = false

  constructor() {
    // Only enable in specific conditions - PRODUCTION SAFE
    this.checkAndSetDebugMode()
  }

  private checkAndSetDebugMode() {
    // Check multiple conditions for enabling debug mode
    const isDevEnvironment = process.env.NODE_ENV === 'development'
    const isDebugEnvVar = process.env.DEBUG_LOGGING === 'true' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    // Enable debug if ANY condition is met
    this.isEnabled = isDevEnvironment || isDebugEnvVar
    
    if (this.isEnabled) {
      console.log('🔧 Server Logger initialized (Debug Mode Active)', {
        development: isDevEnvironment,
        envVar: isDebugEnvVar
      })
    }
  }

  // Public method to check if enabled
  isDebugEnabled() {
    return this.isEnabled
  }

  // Public methods to control debug mode
  enable() {
    this.isEnabled = true
    console.log('🔧 Server debug mode enabled manually')
  }

  disable() {
    this.isEnabled = false
    console.log('🔧 Server debug mode disabled')
  }

  private addEvent(event: ServerLogEvent) {
    if (!this.isEnabled) return

    this.events.push(event)
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console output with timestamps (only when debug enabled)
    const timestamp = new Date(event.timestamp).toISOString()
    const prefix = this.getLogPrefix(event.type)
    
    console.log(`${prefix} [${timestamp}] ${event.endpoint || event.type}: ${event.duration ? `${event.duration}ms` : ''}`, 
                event.error ? `ERROR: ${event.error}` : '', 
                event.details ? event.details : '')
  }

  private getLogPrefix(type: ServerLogEvent['type']): string {
    switch (type) {
      case 'DATABASE': return '💾'
      case 'API': return '🌐'
      case 'ERROR': return '❌'
      case 'PERFORMANCE': return '⚡'
      case 'AUTH': return '🔐'
      default: return '📝'
    }
  }

  logApiCall(endpoint: string, method: string, startTime: number, userId?: string, error?: any) {
    if (!this.isEnabled) return

    const duration = Date.now() - startTime
    this.addEvent({
      timestamp: Date.now(),
      type: 'API',
      endpoint,
      method,
      duration,
      userId,
      error
    })
  }

  logDatabaseQuery(query: string, startTime: number, error?: any, details?: any) {
    if (!this.isEnabled) return

    const duration = Date.now() - startTime
    this.addEvent({
      timestamp: Date.now(),
      type: 'DATABASE',
      query: query.slice(0, 100) + (query.length > 100 ? '...' : ''), // Truncate long queries
      duration,
      error,
      details
    })
  }

  logError(endpoint: string, error: any, userId?: string, details?: any) {
    // Always log errors to console, even if debug is disabled (for production error tracking)
    const errorMessage = error?.message || error
    console.error(`❌ [${new Date().toISOString()}] ${endpoint}: ${errorMessage}`, details || '')

    // Only store in events array if debug is enabled
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'ERROR',
      endpoint,
      error: errorMessage,
      userId,
      details
    })
  }

  logAuth(action: string, userId?: string, success: boolean = true, details?: any) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'AUTH',
      endpoint: action,
      userId,
      error: success ? null : 'Authentication failed',
      details
    })
  }

  logPerformance(category: string, duration: number, details?: any) {
    if (!this.isEnabled) return

    if (duration > 1000) { // Only log slow operations
      this.addEvent({
        timestamp: Date.now(),
        type: 'PERFORMANCE',
        endpoint: category,
        duration,
        details
      })
    }
  }

  getSlowQueries(thresholdMs: number = 1000) {
    if (!this.isEnabled) return []

    return this.events
      .filter(e => e.type === 'DATABASE' && e.duration && e.duration > thresholdMs)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
  }

  getErrorSummary() {
    if (!this.isEnabled) return []

    const errors = this.events.filter(e => e.type === 'ERROR')
    const errorCounts = new Map<string, number>()
    
    for (const error of errors) {
      const key = `${error.endpoint}: ${error.error}`
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1)
    }
    
    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }

  generateReport(): string {
    if (!this.isEnabled) return 'Server debug mode is disabled'

    const now = Date.now()
    const last10Minutes = now - (10 * 60 * 1000)
    const recentEvents = this.events.filter(e => e.timestamp > last10Minutes)

    let report = '🔍 SERVER DEBUG REPORT (Last 10 minutes)\n'
    report += '═══════════════════════════════════════\n\n'

    // API Performance
    const apiCalls = recentEvents.filter(e => e.type === 'API')
    const avgApiTime = apiCalls.reduce((sum, e) => sum + (e.duration || 0), 0) / apiCalls.length
    report += `🌐 API PERFORMANCE: ${apiCalls.length} calls, avg ${avgApiTime.toFixed(2)}ms\n\n`

    // Slow Database Queries
    const slowQueries = this.getSlowQueries(500)
    report += '💾 SLOW DATABASE QUERIES:\n'
    for (const query of slowQueries.slice(0, 5)) {
      report += `  ${query.duration}ms: ${query.query}\n`
    }

    // Error Summary
    const errorSummary = this.getErrorSummary()
    report += '\n❌ ERROR SUMMARY:\n'
    for (const [error, count] of errorSummary.slice(0, 5)) {
      report += `  ${count}x: ${error}\n`
    }

    return report
  }

  // Express middleware for automatic API logging
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now()
      const originalSend = res.send

      res.send = function(data: any) {
        const userId = req.headers['x-user-id'] || req.headers['x-user-email']
        const isError = res.statusCode >= 400
        
        serverLogger.logApiCall(
          req.path,
          req.method,
          startTime,
          userId,
          isError ? { statusCode: res.statusCode, data } : null
        )

        return originalSend.call(this, data)
      }

      next()
    }
  }
}

export const serverLogger = new ServerLogger()

// Database query wrapper with automatic logging
export const loggedPrismaQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    serverLogger.logDatabaseQuery(queryName, startTime)
    return result
  } catch (error) {
    serverLogger.logDatabaseQuery(queryName, startTime, error)
    throw error
  }
}

export default serverLogger 