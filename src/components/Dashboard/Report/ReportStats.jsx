import { FilePieChart, Clock, TrendingUp, AlertCircle } from "lucide-react"

export default function ReportStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Pending</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalPending}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <FilePieChart className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Today Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.todayTasks}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.upcomingTasks}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.overdueTasks}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
