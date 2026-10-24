"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Bot, MessageCircle, Sparkles, Send, Zap, Users, Lightbulb } from "lucide-react"

export default function AIHelperPage() {
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI System Helper. I can help you with:\n\n• System ideas and design\n• Workflow suggestions\n• KPI & KRA creation\n• Company policy making\n• System implementation\n• Staff training guidance\n\nWhat would you like to create or improve today?",
      sender: "ai",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState(null);
  // const [user, setUser] = useState(null);
  const storageKey = companyName ? `ai_helper_chat_${companyName}` : null;
  const [suggestedTopics] = useState([
    { id: 1, text: "Need a production tracking system" },
    { id: 2, text: "How to design KPIs for my team?" },
    { id: 3, text: "Create attendance policy" },
    { id: 4, text: "Staff training methods" },
    { id: 5, text: "Sales workflow design" },
    { id: 6, text: "Inventory management system" },
  ])

  useEffect(() => {
    const cname = localStorage.getItem("company_name");
    
    setCompanyName(cname);
  }, []);

  useEffect(() => {
    // Clear AI helper chat on page refresh
    if (companyName) {
      const key = `ai_helper_chat_${companyName}`;
      localStorage.removeItem(key);
      
    }
  }, [companyName]);

  const chatContainerRef = useRef(null)

  const formatAIResponse = (text) => {
  if (!text) return text;

  let formatted = text;

  // 1️⃣ Convert ### Heading to bold text (remove ###)
  formatted = formatted.replace(
    /^###\s*(.+)$/gm,
    "<strong>$1</strong>"
  );

  // 2️⃣ Convert **text** to <strong>text</strong>
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  return formatted;
};

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Convert chatMessages to backend format
  const formatChatHistory = () => {
    // Skip the first message (welcome message) and only include actual conversation
    const conversationMessages = chatMessages.slice(1);
    
    return conversationMessages.map(msg => ({
      type: msg.sender === "user" ? "human" : "ai",
      content: msg.text
    }));
  }

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now(),
      text: chatInput,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setLoading(true)

    try {
      // Prepare the request body according to your backend's expected format
      if (!companyName) {
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Company context not found. Please logout and login again.",
            sender: "ai",
            timestamp: new Date().toISOString(),
          }
        ]);
        setLoading(false);
        return;
      }

      const requestBody = {
        question: chatInput,
        chat_history: formatChatHistory(),
        company_name: companyName
      };

      

      // Call your AI endpoint
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      
      
      
      // Your backend returns { "answer": "response text" }
      const aiResponse = data.answer || data.response || data.message || 
                        "Sorry, I couldn't generate a response at the moment."
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: "ai",
        timestamp: new Date().toISOString(),
      }

      setChatMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error calling AI endpoint:", error)
      
      // Show error message to user
      const aiMessage = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error while processing your request. Please try again.\n\nError: ${error.message}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
      }

      setChatMessages((prev) => [...prev, aiMessage])
    } finally {
      setLoading(false)
    }
  }, [chatInput, chatMessages, companyName])

  const handleSuggestedTopic = (topic) => {
    setChatInput(topic)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI System Consultant</h1>
              <p className="text-blue-100 text-sm">Expert guidance for system design & workflows</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[72vh] p-4">
          {/* Left Panel - Chat Interface */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-3 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 text-sm">AI System Consultant</h2>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 bg-gray-50"
            >
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-3 ${message.sender === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-xl p-3 text-sm ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === "ai" && (
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div
                          className="whitespace-pre-line leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html:
                              message.sender === "ai"
                                ? formatAIResponse(message.text)
                                : message.text,
                          }}
                        />
                        <div
                          className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="text-left mb-3">
                  <div className="inline-block bg-white border border-gray-200 rounded-xl p-3 rounded-bl-none shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your system requirement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    rows="2"
                    disabled={loading}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="text-xs text-gray-500">
                      {loading ? "AI is thinking..." : "Press Enter to send"}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || loading}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium text-xs ${
                        !chatInput.trim() || loading
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Features & Suggestions */}
          <div className="overflow-y-auto space-y-4 flex flex-col">
            {/* Quick Suggestions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Quick Ideas</h3>
              </div>
              <div className="space-y-2">
                {suggestedTopics.slice(0, 4).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSuggestedTopic(topic.text)}
                    disabled={loading}
                    className={`w-full text-left p-2 rounded-lg border transition-colors text-xs ${
                      loading
                        ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700"
                    }`}
                  >
                    <div className="flex items-start">
                      <Zap className="w-3 h-3 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{topic.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Status */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900 text-sm">AI Connection</h3>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Endpoint: <span className="font-mono text-blue-600">new-ai-agent-3.onrender.com</span></p>
                <p>Status: <span className="text-green-600 font-medium">Connected</span></p>
                <p className="text-gray-500 mt-2">Your messages are being processed by the AI agent in real-time.</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}