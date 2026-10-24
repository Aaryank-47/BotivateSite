"use client"
import { motion } from "framer-motion"
import { FileText, MessageCircle, Mail, Shield, HelpCircle, Phone } from "lucide-react"

const TroubleshootPage = () => {
  const troubleshootCategories = [
    {
      icon: FileText,
      title: "Looker Studio Issues",
      description: "3 common issues with solutions",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Messaging Issues",
      description: "2 common issues with solutions",
      color: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      bgColor: "bg-green-50",
    },
    {
      icon: Mail,
      title: "Email Issues",
      description: "2 common issues with solutions",
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-200",
      bgColor: "bg-purple-50",
    },
    {
      icon: Shield,
      title: "Dashboard & Access Issues",
      description: "2 common issues with solutions",
      color: "from-orange-500 to-orange-600",
      borderColor: "border-orange-200",
      bgColor: "bg-orange-50",
    },
    {
      icon: HelpCircle,
      title: "Other Common Issues",
      description: "3 common issues with solutions",
      color: "from-gray-500 to-gray-600",
      borderColor: "border-gray-200",
      bgColor: "bg-gray-50",
    },
  ]

  const contactOptions = [
    {
      icon: Phone,
      label: "Call Support",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => window.open("tel:+919993023243"),
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      action: () => window.open("https://wa.me/919993023243"),
    },
    {
      icon: Mail,
      label: "Email",
      color: "bg-red-500 hover:bg-red-600",
      action: () => window.open("mailto:info@botivate.in"),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Troubleshoot Guidance
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our interactive guide to find solutions for common issues with Botivate services.
          </p>
        </motion.div>

        {/* Troubleshoot Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {troubleshootCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`${category.bgColor} ${category.borderColor} border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <category.icon className="text-white" size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                <button className="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-2 transition-colors">
                  <span>Explore Solutions</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {contactOptions.map((option, index) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={option.action}
                className={`${option.color} text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg`}
              >
                <option.icon size={20} />
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Clear Cache</h3>
              <p className="text-sm opacity-90">
                Try clearing your browser cache if you're experiencing loading issues.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Check Connection</h3>
              <p className="text-sm opacity-90">
                Ensure you have a stable internet connection for optimal performance.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Update Browser</h3>
              <p className="text-sm opacity-90">Use the latest version of your browser for the best experience.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TroubleshootPage
