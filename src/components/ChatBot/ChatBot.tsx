"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, User, Phone, Clock, Minimize2 } from "lucide-react"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Xin chào! Tôi là trợ lý ảo của Paradise Resort. Tôi có thể giúp bạn tìm hiểu về các dịch vụ, đặt phòng, hoặc trả lời bất kỳ câu hỏi nào về khu nghỉ dưỡng. Bạn cần hỗ trợ gì hôm nay?",
    sender: "bot",
    timestamp: new Date(),
  },
]

const quickReplies = ["Giá phòng như thế nào?", "Có những dịch vụ gì?", "Cách đặt phòng?", "Liên hệ trực tiếp"]

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(text.trim())
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const getBotResponse = (userText: string): string => {
    const text = userText.toLowerCase()

    if (text.includes("giá") || text.includes("phòng")) {
      return "Giá phòng tại Paradise Resort từ 2.500.000 VNĐ/đêm tùy theo loại phòng và thời gian. Chúng tôi có nhiều gói ưu đãi hấp dẫn:\n\n• Deluxe Room: 2.500.000 - 3.500.000 VNĐ\n• Ocean View Suite: 4.500.000 - 6.000.000 VNĐ\n• Presidential Villa: 8.000.000 - 12.000.000 VNĐ\n\nBạn muốn tôi tư vấn thêm về loại phòng nào không?"
    }

    if (text.includes("dịch vụ") || text.includes("tiện ích")) {
      return "Paradise Resort cung cấp đầy đủ các dịch vụ cao cấp:\n\n🏖️ Bãi biển riêng & thể thao nước\n🍽️ 3 nhà hàng & 2 quầy bar\n💆‍♀️ Spa & massage thư giãn\n🏊‍♂️ Hồ bơi vô cực\n🎾 Sân tennis & golf mini\n👶 Khu vui chơi trẻ em\n🚗 Đưa đón sân bay miễn phí\n\nBạn quan tâm đến dịch vụ nào đặc biệt?"
    }

    if (text.includes("đặt") || text.includes("booking")) {
      return "Để đặt phòng tại Paradise Resort, bạn có thể:\n\n📞 Gọi hotline: 1900-1234\n💻 Đặt online tại website\n📧 Email: booking@paradiseresort.com\n🏨 Đến trực tiếp tại resort\n\nĐặt trước 30 ngày được giảm 20%! Bạn muốn tôi hỗ trợ đặt phòng ngay không?"
    }

    if (text.includes("liên hệ") || text.includes("hotline")) {
      return "Thông tin liên hệ Paradise Resort:\n\n📞 Hotline: 1900-1234 (24/7)\n📧 Email: info@paradiseresort.com\n📍 Địa chỉ: 123 Paradise Beach, Nha Trang\n🕐 Giờ làm việc: 24/7\n\nNhân viên tư vấn sẽ hỗ trợ bạn ngay lập tức!"
    }

    return "Cảm ơn bạn đã liên hệ! Tôi đã ghi nhận yêu cầu của bạn. Để được tư vấn chi tiết hơn, vui lòng liên hệ hotline 1900-1234 hoặc để lại thông tin, nhân viên sẽ gọi lại trong 15 phút. Bạn còn câu hỏi gì khác không?"
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-2xl hover:from-sky-600 hover:to-blue-700 hover:scale-110 transition-all duration-300 group"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-white/20 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Paradise Assistant</h3>
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Đang online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-sky-100 text-sky-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        message.sender === "user" ? "bg-sky-500 text-white" : "bg-white border shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === "user" ? "text-sky-100" : "text-gray-500"}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-gray-100">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-sky-100 text-sky-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border rounded-2xl px-4 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="p-3 border-t bg-white">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickReplies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full hover:bg-sky-50 hover:border-sky-300 bg-transparent"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 rounded-full border-gray-300 focus:border-sky-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage(inputValue)
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleSendMessage(inputValue)}
                    className="rounded-full bg-sky-500 hover:bg-sky-600 px-4"
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>1900-1234</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>24/7</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Chat đang được thu gọn</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {messages.length - 1} tin nhắn
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
