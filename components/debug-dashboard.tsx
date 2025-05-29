'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Bug, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  Globe,
  Eye,
  EyeOff,
  Download,
  Trash2
} from 'lucide-react'
import { debugLogger } from '@/utils/debug-logger'

interface DebugDashboardProps {
  className?: string
}

export function DebugDashboard({ className = "" }: DebugDashboardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)

  // Check if debug is enabled on mount and when refresh happens
  useEffect(() => {
    setIsDebugEnabled(debugLogger.isDebugEnabled())
  }, [refreshKey])

  // Auto-refresh every 2 seconds when visible and debug is enabled
  useEffect(() => {
    if (!autoRefresh || !isDebugEnabled || !isVisible) return
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, isDebugEnabled, isVisible])

  // Don't render anything if debug is not enabled
  if (!isDebugEnabled) {
    return null
  }

  // Get real-time data
  const stuckOperations = debugLogger.getStuckOperations()
  const slowApiCalls = debugLogger.getSlowestApiCalls()

  const handleToggleDebugMode = () => {
    if (debugLogger.isDebugEnabled()) {
      debugLogger.disable()
    } else {
      debugLogger.enable()
    }
    setRefreshKey(prev => prev + 1)
    setIsDebugEnabled(debugLogger.isDebugEnabled())
  }

  const handleExportLogs = () => {
    debugLogger.exportToConsole()
    
    // Also generate a downloadable report
    const report = debugLogger.generateReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-report-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMemorySnapshot = () => {
    debugLogger.logMemoryUsage()
    setRefreshKey(prev => prev + 1)
  }

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
          <Badge variant="secondary" className="ml-2 bg-white text-orange-600">
            DEV
          </Badge>
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-96 max-h-96 overflow-y-auto bg-black/90 text-white border-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Bug className="h-4 w-4 mr-2 text-orange-500" />
              Debug Dashboard
              <Badge variant="secondary" className="ml-2 text-xs bg-orange-600 text-white">
                ACTIVE
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-6 w-6 p-0"
                title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
              >
                {autoRefresh ? <Activity className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
                title="Hide dashboard"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span>Debug Mode:</span>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ON
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDebugMode}
                className="h-6 px-2"
                title="Toggle debug mode"
              >
                Toggle
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-600" />

          {/* Stuck Operations */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="font-medium">Stuck Operations</span>
              <Badge variant={stuckOperations.length > 0 ? "destructive" : "secondary"} className="text-xs">
                {stuckOperations.length}
              </Badge>
            </div>
            {stuckOperations.length === 0 ? (
              <div className="text-green-400 text-xs">✓ None detected</div>
            ) : (
              <div className="space-y-1">
                {stuckOperations.slice(0, 3).map((op, index) => (
                  <div key={index} className="text-xs bg-red-900/20 p-1 rounded border border-red-800">
                    <div className="font-mono text-red-300 truncate">{op.id}</div>
                    <div className="text-red-400">{(op.duration / 1000).toFixed(1)}s stuck</div>
                  </div>
                ))}
                {stuckOperations.length > 3 && (
                  <div className="text-gray-400">...and {stuckOperations.length - 3} more</div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-gray-600" />

          {/* Slow API Calls */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">Slowest APIs</span>
              <Badge variant="secondary" className="text-xs">
                {slowApiCalls.length}
              </Badge>
            </div>
            {slowApiCalls.length === 0 ? (
              <div className="text-gray-400 text-xs">No data yet</div>
            ) : (
              <div className="space-y-1">
                {slowApiCalls.slice(0, 3).map((api, index) => (
                  <div key={index} className="text-xs bg-yellow-900/20 p-1 rounded border border-yellow-800">
                    <div className="font-mono truncate text-yellow-200">{api.endpoint}</div>
                    <div className="flex justify-between text-yellow-400">
                      <span>{api.avgTime.toFixed(0)}ms avg</span>
                      <span>{api.calls} calls</span>
                    </div>
                    {api.errorRate > 0 && (
                      <div className="text-red-400">{api.errorRate.toFixed(1)}% errors</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-gray-600" />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportLogs}
              className="h-6 px-2 text-xs"
              title="Export debug report"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMemorySnapshot}
              className="h-6 px-2 text-xs"
              title="Take memory snapshot"
            >
              <Database className="h-3 w-3 mr-1" />
              Memory
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.clear()
                setRefreshKey(prev => prev + 1)
              }}
              className="h-6 px-2 text-xs"
              title="Clear console"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-600">
            <div className="font-medium text-orange-400 mb-1">💡 Debug Controls:</div>
            <div>• Console: <code className="bg-gray-800 px-1 rounded">debugLogger.exportToConsole()</code></div>
            <div>• Enable: <code className="bg-gray-800 px-1 rounded">debugLogger.enable()</code></div>
            <div>• Disable: <code className="bg-gray-800 px-1 rounded">debugLogger.disable()</code></div>
            <div className="mt-1 text-xs text-gray-500">
              Debug auto-enabled in development mode
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 