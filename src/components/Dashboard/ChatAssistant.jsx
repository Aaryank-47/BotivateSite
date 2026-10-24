"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { MessageCircle, X, Sparkles, Send, User, Bot, Loader2 } from "lucide-react"

const ChatAssistant = () => {
  // Chat states
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI troubleshooting assistant. I can help you with WhatsApp, Looker Studio, Email, and Dashboard issues. How can I assist you today?", 
      sender: "ai", 
      timestamp: new Date().toISOString() 
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const API_URL = "https://ai-agent-ja64.onrender.com"

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return
    
    const currentInput = chatInput
    setChatInput("")
    setIsLoading(true)

    try {
      const payload = {
        question: currentInput,
        chat_history: []
      }
      
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      

      const botResponse = data.answer || 
                         data.response ||
                         data.message ||
                         data.text ||
                         JSON.stringify(data) ||
                         "No valid response format found"

      const userMessage = {
        id: Date.now(),
        text: currentInput,
        sender: "user",
        timestamp: new Date().toISOString()
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "ai",
        timestamp: new Date().toISOString(),
        formatted: true
      }
      
      setChatMessages(prev => [...prev, userMessage, aiMessage])
      
    } catch (error) {
      console.error("Error sending message:", error)
      
      const userMessage = {
        id: Date.now(),
        text: currentInput,
        sender: "user",
        timestamp: new Date().toISOString()
      }
      
      let errorMessage;
      if (error.message.includes("422")) {
        errorMessage = "The server rejected the request format. Please check your FastAPI model definition."
      } else if (error.message.includes("500")) {
        errorMessage = "Internal server error. Check your agent.py file and model configuration."
      } else {
        errorMessage = `Connection error: ${error.message}. Please check: 1. Backend is running 2. Correct endpoint 3. Network connection`
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: "ai",
        timestamp: new Date().toISOString(),
        formatted: false
      }
      
      setChatMessages(prev => [...prev, userMessage, aiMessage])
    } finally {
      setIsLoading(false)
    }
  }, [chatInput, isLoading])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setChatMessages([{
      id: 1,
      text: "Chat cleared! How can I assist you with technical issues now?",
      sender: "ai",
      timestamp: new Date().toISOString()
    }])
  }

  const suggestedQuestions = [
    "How to fix WhatsApp API issues?",
    "Looker Studio connection problems",
    "Email SMTP configuration help",
    "Dashboard performance optimization"
  ]

  return (
    <>
      {/* AI Chat Popup */}
      {showChat && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Troubleshooting Assistant</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="text-white hover:text-gray-200 text-xs px-2 py-1 bg-white/20 rounded"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto p-4 bg-gray-50">
            {chatMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 ${message.sender === "user" ? "text-right" : "text-left"}`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`inline-block max-w-[80%] rounded-xl p-3 ${message.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                      }`}
                  >
                    {message.sender === "ai" && message.formatted ? (
                      <div className="text-sm space-y-2">
                        {/* Format the response with Markdown-like styling */}
                        {message.text.split('\n').map((line, index) => {
                          // Check for headings
                          if (line.startsWith('# ')) {
                            return <h2 key={index} className="text-lg font-bold text-gray-900 mt-2 mb-1">{line.substring(2)}</h2>
                          }
                          // Check for bold text with **
                          const boldRegex = /\*\*(.*?)\*\*/g
                          if (boldRegex.test(line)) {
                            const parts = line.split(/(\*\*.*?\*\*)/g)
                            return (
                              <p key={index} className="mb-1">
                                {parts.map((part, i) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                                  }
                                  return part
                                })}
                              </p>
                            )
                          }
                          // Check for bullet points
                          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                            return (
                              <div key={index} className="flex items-start ml-2 mb-1">
                                <span className="text-gray-600 mr-2">•</span>
                                <span>{line.trim().substring(2)}</span>
                              </div>
                            )
                          }
                          // Check for numbered steps
                          const stepMatch = line.match(/^(\d+)\.\s+(.*)/)
                          if (stepMatch) {
                            return (
                              <div key={index} className="flex items-start ml-2 mb-1">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
                                  {stepMatch[1]}
                                </span>
                                <span>{stepMatch[2]}</span>
                              </div>
                            )
                          }
                          // Regular paragraph
                          if (line.trim() !== '') {
                            return <p key={index} className="mb-1">{line}</p>
                          }
                          return <br key={index} />
                        })}
                      </div>
                    ) : (
                      <p className="text-sm">{message.text}</p>
                    )}
                    <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          <div className="px-4 py-2 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setChatInput(question)}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about technical issues..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isLoading}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${!chatInput.trim() || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Toggle Button */}
      {/* <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowChat(!showChat)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40 flex items-center justify-center transition-all duration-300 ${showChat
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          }`}
      >
        {showChat ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
            />
          </div>
        )}
      </motion.button> */}
    </>
  )
}

export default ChatAssistant