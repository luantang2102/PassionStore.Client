import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare, Search } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "../../store/store";
import { useFetchChatsQuery, useCreateChatMutation, useFetchMessagesQuery, useSendMessageMutation } from "../../api/chatApi";
import { useFetchNotificationsQuery, useMarkNotificationAsReadMutation } from "../../api/notificationApi";
import { ChatResponse, MessageParams, MessageResponse } from "../../models/responses/chat";
import { NotificationResponse } from "../../models/responses/notification";

const Chat = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { darkMode } = useAppSelector((state) => state.ui);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatResponse | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [createChat] = useCreateChatMutation();
  const [sendMessage] = useSendMessageMutation();
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const { data: chatsData } = useFetchChatsQuery(
    { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0 },
    { skip: !isAuthenticated }
  );
  const { data: messagesData } = useFetchMessagesQuery(
    {
      chatId: selectedChat?.id || "",
      params: { pageNumber: 1, pageSize: 20, orderBy: "createdDate_asc" } as MessageParams,
    },
    { skip: !selectedChat || !isAuthenticated }
  );
  const { data: notificationsData } = useFetchNotificationsQuery(
    { pageNumber: 1, pageSize: 10, isRead: false, searchTerm },
    { skip: !isAuthenticated }
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Initialize SignalR connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:5001/chatHub", { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveMessage", (chatId: string, userId: string, content: string) => {
      if (chatId === selectedChat?.id) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), chatId, content, isUserMessage: userId === user?.id, createdDate: new Date().toISOString() },
        ]);
      }
    });

    connection.on("ReceiveNotification", (objectId: string, content: string) => {
      setNotifications((prev) => [
        ...prev,
        { id: crypto.randomUUID(), userId: user?.id || "", objectId, objectType: "ChatMessage", content, isRead: false, createdDate: new Date().toISOString() },
      ]);
    });

    connection.start().catch((err) => console.error("SignalR Connection Error:", err));

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, user?.id, selectedChat?.id]);

  // Update messages when API data changes
  useEffect(() => {
    if (messagesData?.items) {
      setMessages(messagesData.items);
    }
  }, [messagesData]);

  // Update chats when API data changes
  useEffect(() => {
    if (chatsData?.items) {
      setChats(chatsData.items);
    }
  }, [chatsData]);

  // Update notifications when API data changes
  useEffect(() => {
    if (notificationsData?.items) {
      setNotifications(notificationsData.items);
    }
  }, [notificationsData]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle creating a new chat
  const handleCreateChat = async () => {
    try {
      const result = await createChat({ topic: `Support Chat ${new Date().toLocaleDateString()}` }).unwrap();
      setChats((prev) => [...prev, result]);
      setSelectedChat(result);
      setIsOpen(true);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    try {
      await sendMessage({ chatId: selectedChat.id, messageRequest: { content: message } }).unwrap();
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Handle marking notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId).unwrap();
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Local state for chats
  const [chats, setChats] = useState<ChatResponse[]>([]);

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          disabled
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ${
          darkMode ? "hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700" : ""
        }`}
      >
        <MessageSquare className="h-6 w-6" />
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-white text-xs rounded-full bg-red-500">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`absolute bottom-16 right-0 w-80 md:w-96 rounded-lg shadow-xl border overflow-hidden ${
              darkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold">Hỗ Trợ Khách Hàng</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat List */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCreateChat}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700"
              >
                Tạo Cuộc Trò Chuyện Mới
              </button>
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-2 rounded-md cursor-pointer ${
                      selectedChat?.id === chat.id
                        ? darkMode
                          ? "bg-gray-700"
                          : "bg-blue-100"
                        : darkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-medium">{chat.topic}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(chat.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            {selectedChat && (
              <div className="p-4 max-h-60 overflow-y-auto scrollbar-hide">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.isUserMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.isUserMessage
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Message Input */}
            {selectedChat && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className={`flex-1 p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2">Thông Báo</h4>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm thông báo..."
                    className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-gray-300 placeholder-gray-400"
                        : "border-gray-200 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkNotificationAsRead(notification.id)}
                      className={`p-2 rounded-md cursor-pointer ${
                        notification.isRead
                          ? darkMode
                            ? "bg-gray-700"
                            : "bg-gray-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <p className="text-sm">{notification.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdDate).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;