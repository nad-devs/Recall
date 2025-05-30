import { useRef, useMemo, useEffect } from 'react'

interface LogEvent {
  timestamp: number
  type: 'API_CALL' | 'STATE_CHANGE' | 'USER_ACTION' | 'ERROR' | 'PERFORMANCE' | 'DATABASE'
  category: string
  message: string
  data?: any
  duration?: number
  stack?: string
}

interface PerformanceMetrics {
  apiCalls: Map<string, { count: number; totalTime: number; errors: number; lastCall: number }>
  stateChanges: Map<string, { count: number; lastChange: number }>
  operations: Map<string, { startTime: number; status: 'pending' | 'completed' | 'failed' }>
}

interface DebugLoggerInterface {
  logUserAction: (action: string, data?: any) => void
  logError: (error: string, data?: any) => void
  logStateChange: (stateName: string, oldValue: any, newValue: any) => void
  startOperation: (operationId: string) => void
  completeOperation: (operationId: string) => void
  failOperation: (operationId: string, error: any) => void
  isDebugEnabled: () => boolean
  // Enhanced methods for tracking async flows
  logAsyncStart: (operationName: string, operationId: string, data?: any) => void
  logAsyncEnd: (operationName: string, operationId: string, data?: any) => void
  logAsyncError: (operationName: string, operationId: string, error: any) => void
  logRenderCycle: (componentName: string, renderData?: any) => void
  logEventLoop: (checkPoint: string) => void
  logStackTrace: (label: string) => void
  trackStateUpdate: (component: string, stateName: string, value: any) => void
  trackDialogTransition: (dialog: string, from: string, to: string, trigger: string) => void
}

class DebugLogger {
  private events: LogEvent[] = []
  private metrics: PerformanceMetrics = {
    apiCalls: new Map(),
    stateChanges: new Map(),
    operations: new Map()
  }
  private maxEvents = 1000
  private isEnabled = false

  // Enhanced debugging properties
  private eventLoopCheckId = 0
  stateTransitions = new Map<string, { previous: any, current: any, timestamp: number }>()
  private renderCountRef = { current: 0 }

  constructor() {
    // Only enable in specific conditions - PRODUCTION SAFE
    this.checkAndSetDebugMode()
    
    if (this.isEnabled) {
      console.log('🔧 Debug Logger initialized (Debug Mode Active)')
      this.setupGlobalErrorHandling()
      this.setupPerformanceMonitoring()
    }
  }

  private checkAndSetDebugMode() {
    // Check multiple conditions for enabling debug mode
    const isDevEnvironment = process.env.NODE_ENV === 'development'
    const isDebugEnvVar = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    let isLocalStorageDebug = false
    let isUrlDebug = false
    
    // Safe localStorage check
    if (typeof window !== 'undefined') {
      try {
        isLocalStorageDebug = localStorage.getItem('debug_mode') === 'true'
        isUrlDebug = window.location.search.includes('debug=true')
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    // Enable debug if ANY condition is met
    this.isEnabled = isDevEnvironment || isDebugEnvVar || isLocalStorageDebug || isUrlDebug
    
    if (this.isEnabled) {
      console.log('🔧 Debug mode enabled via:', {
        development: isDevEnvironment,
        envVar: isDebugEnvVar,
        localStorage: isLocalStorageDebug,
        url: isUrlDebug
      })
    }
  }

  // Public methods to control debug mode
  enable() {
    this.isEnabled = true
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('debug_mode', 'true')
      } catch (e) {
        console.warn('Could not save debug mode to localStorage')
      }
    }
    console.log('🔧 Debug mode enabled manually')
  }

  disable() {
    this.isEnabled = false
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('debug_mode')
      } catch (e) {
        console.warn('Could not remove debug mode from localStorage')
      }
    }
    console.log('🔧 Debug mode disabled')
  }

  isDebugEnabled() {
    return this.isEnabled
  }

  private setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('UNHANDLED_PROMISE', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })

    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.logError('UNCAUGHT_ERROR', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.logPerformance('LONG_TASK', `Long task detected: ${entry.duration.toFixed(2)}ms`, {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              })
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.warn('Performance monitoring not available:', e)
      }
    }
  }

  private addEvent(event: LogEvent) {
    if (!this.isEnabled) return

    this.events.push(event)
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console output with color coding
    const timestamp = new Date(event.timestamp).toLocaleTimeString()
    const prefix = this.getLogPrefix(event.type)
    
    console.log(`${prefix} [${timestamp}] ${event.category}: ${event.message}`, event.data || '')
  }

  private getLogPrefix(type: LogEvent['type']): string {
    switch (type) {
      case 'API_CALL': return '🌐'
      case 'STATE_CHANGE': return '🔄'
      case 'USER_ACTION': return '👆'
      case 'ERROR': return '❌'
      case 'PERFORMANCE': return '⚡'
      case 'DATABASE': return '💾'
      default: return '📝'
    }
  }

  // Enhanced debugging methods
  getStackTrace() {
    try {
      throw new Error()
    } catch (e: any) {
      return e.stack?.split('\n').slice(2, 8).join('\n') || 'No stack trace available'
    }
  }

  checkEventLoop(checkPoint: string) {
    const checkId = ++this.eventLoopCheckId
    const startTime = performance.now()
    
    setTimeout(() => {
      const endTime = performance.now()
      const delay = endTime - startTime
      
      if (delay > 50) {
        console.warn(`🔴 EVENT LOOP DELAY at ${checkPoint}: ${delay.toFixed(2)}ms (check #${checkId})`)
      } else {
        console.log(`🟢 Event loop OK at ${checkPoint}: ${delay.toFixed(2)}ms (check #${checkId})`)
      }
    }, 0)
  }

  // Enhanced methods for tracking async flows
  logAsyncStart(operationName: string, operationId: string, data?: any) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`🔄 [${operationName}][${timestamp}] ASYNC START: ${operationName} (${operationId})`, data || '')
    console.time(`⏱️ ASYNC ${operationId}`)
    this.checkEventLoop(`async-start-${operationName}`)
  }

  logAsyncEnd(operationName: string, operationId: string, data?: any) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`✅ [${operationName}][${timestamp}] ASYNC END: ${operationName} (${operationId})`, data || '')
    console.timeEnd(`⏱️ ASYNC ${operationId}`)
    this.checkEventLoop(`async-end-${operationName}`)
  }

  logAsyncError(operationName: string, operationId: string, error: any) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.error(`💥 [${operationName}][${timestamp}] ASYNC ERROR: ${operationName} (${operationId})`, error)
    console.timeEnd(`⏱️ ASYNC ${operationId}`)
    this.checkEventLoop(`async-error-${operationName}`)
  }

  logRenderCycle(componentName: string, renderData?: any) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`🎨 [${componentName}][${timestamp}] RENDER #${this.renderCountRef.current}`, renderData || '')
    this.checkEventLoop(`render-${componentName}`)
  }

  logEventLoop(checkPoint: string) {
    if (!this.isEnabled) return
    this.checkEventLoop(checkPoint)
  }

  logStackTrace(label: string) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`📍 [${label}][${timestamp}] STACK TRACE - ${label}:`)
    console.log(this.getStackTrace())
  }

  trackStateUpdate(component: string, stateName: string, value: any) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`📊 [${component}][${timestamp}] STATE UPDATE: ${stateName} =`, value)
    this.checkEventLoop(`state-update-${stateName}`)
  }

  trackDialogTransition(dialog: string, from: string, to: string, trigger: string) {
    if (!this.isEnabled) return
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    console.log(`🔲 [${dialog}][${timestamp}] DIALOG: ${dialog} | ${from} → ${to} | trigger: ${trigger}`)
    this.checkEventLoop(`dialog-transition-${dialog}`)
  }

  // API Call tracking
  logApiCall(endpoint: string, method: string, startTime: number, duration?: number, error?: any) {
    if (!this.isEnabled) return

    const event: LogEvent = {
      timestamp: Date.now(),
      type: 'API_CALL',
      category: `${method} ${endpoint}`,
      message: error ? `Failed after ${duration?.toFixed(2)}ms` : `Completed in ${duration?.toFixed(2)}ms`,
      data: { endpoint, method, duration, error },
      duration
    }
    
    this.addEvent(event)
    this.updateApiMetrics(endpoint, duration || 0, !!error)
  }

  private updateApiMetrics(endpoint: string, duration: number, hasError: boolean) {
    if (!this.isEnabled) return

    const current = this.metrics.apiCalls.get(endpoint) || { count: 0, totalTime: 0, errors: 0, lastCall: 0 }
    current.count++
    current.totalTime += duration
    if (hasError) current.errors++
    current.lastCall = Date.now()
    this.metrics.apiCalls.set(endpoint, current)
  }

  // State change tracking
  logStateChange(component: string, stateName: string, oldValue: any, newValue: any) {
    if (!this.isEnabled) return

    const event: LogEvent = {
      timestamp: Date.now(),
      type: 'STATE_CHANGE',
      category: component,
      message: `${stateName} changed`,
      data: { stateName, oldValue, newValue }
    }
    
    this.addEvent(event)
    this.updateStateMetrics(`${component}.${stateName}`)
  }

  private updateStateMetrics(stateKey: string) {
    if (!this.isEnabled) return

    const current = this.metrics.stateChanges.get(stateKey) || { count: 0, lastChange: 0 }
    current.count++
    current.lastChange = Date.now()
    this.metrics.stateChanges.set(stateKey, current)
  }

  // User action tracking
  logUserAction(action: string, details?: any) {
    if (!this.isEnabled) return

    const event: LogEvent = {
      timestamp: Date.now(),
      type: 'USER_ACTION',
      category: 'USER_INTERACTION',
      message: action,
      data: details
    }
    
    this.addEvent(event)
  }

  // Error tracking
  logError(category: string, message: string, details?: any) {
    if (!this.isEnabled) return

    const event: LogEvent = {
      timestamp: Date.now(),
      type: 'ERROR',
      category,
      message,
      data: details,
      stack: new Error().stack
    }
    
    this.addEvent(event)
  }

  // Performance tracking
  logPerformance(category: string, message: string, metrics: any) {
    if (!this.isEnabled) return

    const event: LogEvent = {
      timestamp: Date.now(),
      type: 'PERFORMANCE',
      category,
      message,
      data: metrics
    }
    
    this.addEvent(event)
  }

  // Operation tracking
  startOperation(operationId: string) {
    if (!this.isEnabled) return

    this.metrics.operations.set(operationId, {
      startTime: Date.now(),
      status: 'pending'
    })
    
    this.logPerformance('OPERATION_START', `Started operation: ${operationId}`, { operationId })
  }

  completeOperation(operationId: string) {
    if (!this.isEnabled) return

    const operation = this.metrics.operations.get(operationId)
    if (operation) {
      const duration = Date.now() - operation.startTime
      operation.status = 'completed'
      this.logPerformance('OPERATION_COMPLETE', `Completed operation: ${operationId}`, { 
        operationId, 
        duration,
        durationMs: duration
      })
    }
  }

  failOperation(operationId: string, error: any) {
    if (!this.isEnabled) return

    const operation = this.metrics.operations.get(operationId)
    if (operation) {
      const duration = Date.now() - operation.startTime
      operation.status = 'failed'
      this.logError('OPERATION_FAILED', `Failed operation: ${operationId}`, { 
        operationId, 
        duration,
        error 
      })
    }
  }

  // Report generation
  generateReport(): string {
    if (!this.isEnabled) return 'Debug mode is disabled'

    const now = Date.now()
    const last5Minutes = now - (5 * 60 * 1000)
    const recentEvents = this.events.filter(e => e.timestamp > last5Minutes)

    let report = '🔍 DEBUG REPORT (Last 5 minutes)\n'
    report += '═══════════════════════════════════════\n\n'

    // API Performance
    report += '🌐 API PERFORMANCE:\n'
    for (const [endpoint, metrics] of this.metrics.apiCalls.entries()) {
      const avgTime = metrics.totalTime / metrics.count
      const errorRate = (metrics.errors / metrics.count) * 100
      report += `  ${endpoint}: ${metrics.count} calls, avg ${avgTime.toFixed(2)}ms, ${errorRate.toFixed(1)}% errors\n`
    }

    // Pending Operations
    report += '\n⏳ PENDING OPERATIONS:\n'
    const pendingOps = Array.from(this.metrics.operations.entries()).filter(([_, op]) => op.status === 'pending')
    for (const [opId, op] of pendingOps) {
      const duration = now - op.startTime
      report += `  ${opId}: ${duration}ms (${duration > 30000 ? 'STUCK?' : 'running'})\n`
    }

    // Recent Errors
    report += '\n❌ RECENT ERRORS:\n'
    const errors = recentEvents.filter(e => e.type === 'ERROR').slice(-10)
    for (const error of errors) {
      const time = new Date(error.timestamp).toLocaleTimeString()
      report += `  [${time}] ${error.category}: ${error.message}\n`
    }

    // High-frequency state changes
    report += '\n🔄 FREQUENT STATE CHANGES:\n'
    for (const [stateKey, metrics] of this.metrics.stateChanges.entries()) {
      if (metrics.count > 10) {
        report += `  ${stateKey}: ${metrics.count} changes\n`
      }
    }

    return report
  }

  // Export functions for browser console
  exportToConsole() {
    if (!this.isEnabled) {
      console.log('Debug logging is disabled. Call debugLogger.enable() to activate.')
      return
    }

    console.group('🔍 Debug Logger Report')
    console.log(this.generateReport())
    console.log('Recent events:', this.events.slice(-20))
    console.log('API metrics:', Object.fromEntries(this.metrics.apiCalls))
    console.log('State metrics:', Object.fromEntries(this.metrics.stateChanges))
    console.log('Operations:', Object.fromEntries(this.metrics.operations))
    console.groupEnd()
  }

  // Get specific metrics
  getStuckOperations() {
    if (!this.isEnabled) return []

    const now = Date.now()
    return Array.from(this.metrics.operations.entries())
      .filter(([_, op]) => op.status === 'pending' && (now - op.startTime) > 30000)
      .map(([id, op]) => ({ id, duration: now - op.startTime }))
  }

  getSlowestApiCalls() {
    if (!this.isEnabled) return []

    return Array.from(this.metrics.apiCalls.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        avgTime: metrics.totalTime / metrics.count,
        errorRate: (metrics.errors / metrics.count) * 100,
        calls: metrics.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)
  }

  // Memory usage tracking
  logMemoryUsage() {
    if (!this.isEnabled) return

    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      this.logPerformance('MEMORY_USAGE', 'Memory snapshot', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      })
    }
  }
}

// Global instance
export const debugLogger = new DebugLogger()

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  ;(window as any).debugLogger = debugLogger
}

// Enhanced React hook for component-level debugging
export const useDebugLogger = (componentName: string): DebugLoggerInterface => {
  const isDebugMode = useRef(
    typeof window !== 'undefined' && 
    (window.localStorage.getItem('debug') === 'true' || 
     window.location.search.includes('debug=true'))
  )

  // Component render tracking
  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  const logger = useMemo(() => {
    const baseLogger = {
      logUserAction: (action: string, data?: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        const prefix = `🎯 [${componentName}][${timestamp}]`
        
        if (data && Object.keys(data).length > 0) {
          console.log(`${prefix} ${action}:`, data)
        } else {
          console.log(`${prefix} ${action}`)
        }
      },

      logError: (error: string, data?: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        const prefix = `❌ [${componentName}][${timestamp}]`
        
        if (data && Object.keys(data).length > 0) {
          console.error(`${prefix} ${error}:`, data)
        } else {
          console.error(`${prefix} ${error}`)
        }
      },

      logStateChange: (stateName: string, oldValue: any, newValue: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        const stateKey = `${componentName}.${stateName}`
        
        // Track transition
        debugLogger.stateTransitions.set(stateKey, {
          previous: oldValue,
          current: newValue,
          timestamp: Date.now()
        })
        
        console.log(`🔄 [${componentName}][${timestamp}] STATE: ${stateName}`, {
          from: oldValue,
          to: newValue,
          changed: oldValue !== newValue
        })
        
        // Check for rapid state changes (potential infinite loops)
        const recentTransitions = Array.from(debugLogger.stateTransitions.entries())
          .filter(([_, transition]) => Date.now() - transition.timestamp < 1000)
          .filter(([key, _]) => key === stateKey)
        
        if (recentTransitions.length > 5) {
          console.warn(`🚨 RAPID STATE CHANGES detected for ${stateKey}:`, recentTransitions)
        }
      },

      startOperation: (operationId: string) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`🚀 [${componentName}][${timestamp}] START: ${operationId}`)
        console.time(`⏱️ ${operationId}`)
      },

      completeOperation: (operationId: string) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`✅ [${componentName}][${timestamp}] COMPLETE: ${operationId}`)
        console.timeEnd(`⏱️ ${operationId}`)
      },

      failOperation: (operationId: string, error: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`💥 [${componentName}][${timestamp}] FAILED: ${operationId}`, error)
        console.timeEnd(`⏱️ ${operationId}`)
      },

      isDebugEnabled: () => isDebugMode.current,

      // Enhanced async tracking
      logAsyncStart: (operationName: string, operationId: string, data?: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`🔄 [${componentName}][${timestamp}] ASYNC START: ${operationName} (${operationId})`, data || '')
        console.time(`⏱️ ASYNC ${operationId}`)
        debugLogger.checkEventLoop(`async-start-${operationName}`)
      },

      logAsyncEnd: (operationName: string, operationId: string, data?: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`✅ [${componentName}][${timestamp}] ASYNC END: ${operationName} (${operationId})`, data || '')
        console.timeEnd(`⏱️ ASYNC ${operationId}`)
        debugLogger.checkEventLoop(`async-end-${operationName}`)
      },

      logAsyncError: (operationName: string, operationId: string, error: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.error(`💥 [${componentName}][${timestamp}] ASYNC ERROR: ${operationName} (${operationId})`, error)
        console.timeEnd(`⏱️ ASYNC ${operationId}`)
        debugLogger.checkEventLoop(`async-error-${operationName}`)
      },

      logRenderCycle: (componentName: string, renderData?: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`🎨 [${componentName}][${timestamp}] RENDER #${renderCountRef.current}`, renderData || '')
        debugLogger.checkEventLoop(`render-${componentName}`)
      },

      logEventLoop: (checkPoint: string) => {
        if (!isDebugMode.current) return
        debugLogger.checkEventLoop(checkPoint)
      },

      logStackTrace: (label: string) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`📍 [${componentName}][${timestamp}] STACK TRACE - ${label}:`)
        console.log(debugLogger.getStackTrace())
      },

      trackStateUpdate: (component: string, stateName: string, value: any) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`📊 [${component}][${timestamp}] STATE UPDATE: ${stateName} =`, value)
        debugLogger.checkEventLoop(`state-update-${stateName}`)
      },

      trackDialogTransition: (dialog: string, from: string, to: string, trigger: string) => {
        if (!isDebugMode.current) return
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`🔲 [${componentName}][${timestamp}] DIALOG: ${dialog} | ${from} → ${to} | trigger: ${trigger}`)
        debugLogger.checkEventLoop(`dialog-transition-${dialog}`)
      }
    }

    return baseLogger
  }, [componentName])

  return logger
}

// API call wrapper with automatic logging
export const loggedFetch = async (url: string, options: RequestInit = {}) => {
  const startTime = Date.now()
  const operationId = `fetch-${url}-${startTime}`
  
  try {
    debugLogger.startOperation(operationId)
    debugLogger.logApiCall(url, options.method || 'GET', startTime)
    
    const response = await fetch(url, options)
    const duration = Date.now() - startTime
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    debugLogger.completeOperation(operationId)
    debugLogger.logApiCall(url, options.method || 'GET', startTime, duration)
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    debugLogger.failOperation(operationId, error)
    debugLogger.logApiCall(url, options.method || 'GET', startTime, duration, error)
    throw error
  }
}

export default debugLogger 