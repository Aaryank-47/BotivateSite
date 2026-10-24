"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { MessageCircle, Mail, BarChart3, AlertTriangle, Search, ChevronRight, X, Sparkles, Send, User, Bot, Loader2 } from "lucide-react"
import Button from "../ui/Button"
import ChatAssistant from "./ChatAssistant"
import { getPriorityColor } from "../../utils/statusHelpers"

const troubleshootCategories = [
  {
    id: "whatsapp",
    title: "WhatsApp Issues",
    icon: MessageCircle,
    color: "from-green-500 to-green-600",
    issues: [
      {
        title: "WhatsApp Business API not responding",
        description: "API calls timing out or returning errors",
        solution: "Check API credentials and server status. Verify webhook URLs are accessible.",
        priority: "High",
      },
      {
        title: "Messages not being delivered",
        description: "Sent messages showing as failed or not delivered",
        solution: "Verify phone number format, check recipient status, and review message templates.",
        priority: "Medium",
      },
      {
        title: "Webhook not receiving messages",
        description: "Incoming messages not triggering webhook events",
        solution: "Check webhook URL configuration, SSL certificate, and server logs.",
        priority: "High",
      },
    ],
  },
  {
    id: "looker",
    title: "Looker Studio",
    icon: BarChart3,
    color: "from-blue-500 to-blue-600",
    issues: [
      {
        title: "Data source connection failed",
        description: "Unable to connect to database or API",
        solution: "Verify credentials, check firewall settings, and test connection parameters.",
        priority: "High",
      },
      {
        title: "Reports not loading",
        description: "Dashboard showing loading spinner indefinitely",
        solution: "Clear browser cache, check data source permissions, and verify query syntax.",
        priority: "Medium",
      },
      {
        title: "Scheduled reports not sending",
        description: "Automated reports not being delivered via email",
        solution: "Check email settings, verify recipient addresses, and review schedule configuration.",
        priority: "Medium",
      },
    ],
  },
  {
    id: "email",
    title: "Email Issues",
    icon: Mail,
    color: "from-purple-500 to-purple-600",
    issues: [
      {
        title: "SMTP authentication failed",
        description: "Unable to send emails through SMTP server",
        solution: "Verify SMTP credentials, check port settings, and ensure SSL/TLS configuration.",
        priority: "High",
      },
      {
        title: "Emails going to spam",
        description: "Sent emails being marked as spam by recipients",
        solution: "Configure SPF, DKIM, and DMARC records. Review email content and sender reputation.",
        priority: "Medium",
      },
      {
        title: "Email templates not rendering",
        description: "HTML email templates showing broken layout",
        solution: "Check HTML syntax, test across email clients, and validate CSS compatibility.",
        priority: "Low",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard Issues",
    icon: AlertTriangle,
    color: "from-red-500 to-red-600",
    issues: [
      {
        title: "Dashboard loading slowly",
        description: "Dashboard takes too long to load data",
        solution: "Optimize database queries, implement caching, and review server resources.",
        priority: "Medium",
      },
      {
        title: "Charts not displaying data",
        description: "Visualization components showing empty or error state",
        solution: "Check data source connections, verify query results, and review chart configuration.",
        priority: "High",
      },
      {
        title: "User permissions not working",
        description: "Users seeing data they shouldn't have access to",
        solution: "Review role-based access controls, check user group assignments, and audit permissions.",
        priority: "High",
      },
    ],
  },
]


const commonSolutions = [
  {
    title: "Clear Browser Cache",
    description: "Clear browser cache and cookies to resolve display issues",
    steps: ["Open browser settings", "Go to Privacy/Security", "Clear browsing data", "Restart browser"],
  },
  {
    title: "Check Network Connection",
    description: "Verify internet connectivity and firewall settings",
    steps: ["Test internet connection", "Check firewall rules", "Verify DNS settings", "Test from different network"],
  },
  {
    title: "Restart Services",
    description: "Restart application services to resolve temporary issues",
    steps: ["Stop application services", "Wait 30 seconds", "Start services again", "Monitor logs for errors"],
  },
  {
    title: "Update Credentials",
    description: "Refresh API keys and authentication tokens",
    steps: ["Generate new API keys", "Update configuration files", "Test connections", "Monitor for success"],
  },
]

export default function TroubleShootPage() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedIssue, setExpandedIssue] = useState(null)

  // Remove all chat-related states as they're now in ChatAssistant

  const filteredCategories = troubleshootCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.issues.some(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Troubleshoot Center</h1>
            <p className="text-gray-600 text-sm sm:text-base">Find solutions to common technical issues</p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 w-full lg:w-auto">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1 min-w-0 lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}
              >
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                <p className="text-sm text-gray-500">{category.issues.length} issues</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">View solutions</span>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${selectedCategory === category.id ? "rotate-90" : ""
                  }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Category Issues */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {troubleshootCategories.find((cat) => cat.id === selectedCategory)?.title} Issues
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {troubleshootCategories
              .find((cat) => cat.id === selectedCategory)
              ?.issues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === `${selectedCategory}-${index}` ? null : `${selectedCategory}-${index}`,
                      )
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{issue.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      <p className="text-gray-600">{issue.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedIssue === `${selectedCategory}-${index}` ? "rotate-90" : ""
                        }`}
                    />
                  </div>

                  {expandedIssue === `${selectedCategory}-${index}` && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Solution:</h4>
                        <p className="text-blue-800">{issue.solution}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Common Solutions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Common Solutions</h2>
          <p className="text-gray-600">Quick fixes for frequent issues</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonSolutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{solution.title}</h3>
                <p className="text-gray-600 mb-3">{solution.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {solution.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Use the reusable ChatAssistant component */}
      <ChatAssistant />
    </div>
  )
}
