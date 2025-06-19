import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Code,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

export function LearningJourneySidebar() {
  return (
    <div className="space-y-6">
      {/* Personalization Dashboard */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            Learning Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Learning about your preferences
            </span>
            <span className="text-sm font-semibold text-slate-100">67%</span>
          </div>
          <Progress value={67} className="h-2" />

          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-700 text-slate-300 hover:text-slate-100"
          >
            View My Learning Profile
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">
              Quick Preferences
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">More Technical</span>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">More Practical</span>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">More Examples</span>
                <Switch className="data-[state=checked]:bg-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">
                Code Pattern
              </span>
            </div>
            <p className="text-xs text-slate-300">
              This stack pattern appears in 23% of your solved problems
            </p>
          </div>

          <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-green-300">
                Progress
              </span>
            </div>
            <p className="text-xs text-slate-300">
              You're 78% ready for advanced stack problems
            </p>
          </div>

          <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">
                Community
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Similar learners also studied recursion next
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Journey */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-lg">
            Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Arrays & Strings</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-100 font-semibold">
              Stack & Queue
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            <span className="text-sm text-slate-500">Tree Traversal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            <span className="text-sm text-slate-500">Dynamic Programming</span>
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-lg">
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-slate-300">
            <p className="mb-2">
              Based on your pattern, you might also want to add:
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Time complexity analysis</li>
              <li>• Edge case handling</li>
              <li>• Alternative approaches</li>
            </ul>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-700 text-slate-300 hover:text-slate-100"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Apply Suggestions
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 