import React, { useEffect, useRef, useState } from "react";
import { ChatService } from "../services/API_Services";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Halo! 👋\n\nSaya adalah asisten untuk membantu Anda memahami dan mengoperasikan **Planning System Berlindo**. Apa yang bisa saya bantu untuk seputar **Planning System**?",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage or context
  useEffect(() => {
    const getUserInfo = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserInfo(payload);

          // Update welcome message with user info
          if (payload.name || payload.username) {
            setMessages([
              {
                role: "assistant",
                content: `Halo **${payload.name || payload.username}**! 👋\n\nSaya adalah asisten untuk membantu Anda memahami dan mengoperasikan **Planning System Berlindo**. Apa yang bisa saya bantu untuk seputar **Planning System**?\n\n**Role Anda:** ${payload.role || payload.role_name || "User"}`,
              },
            ]);
          }
        }
      } catch (error) {
        console.log("No user info available");
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    if (open && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Scroll to bottom after user message
    setTimeout(scrollToBottom, 100);

    try {
      const payload = {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        model: "deepseek/deepseek-chat-v3-0324:free",
      };

      const res = await ChatService.chatCompletion(payload);
      const content = res?.data?.message?.content || "Maaf, tidak ada jawaban.";
      setMessages((prev) => [...prev, { role: "assistant", content }]);

      // Scroll to bottom after AI response
      setTimeout(scrollToBottom, 100);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e?.message || "gagal memuat jawaban"}`,
        },
      ]);
      setTimeout(scrollToBottom, 100);
    } finally {
      setLoading(false);
    }
  };

  // Function to format text with bold and italic
  const formatMessage = (text: string) => {
    if (!text) return text;

    // First handle bold text (**text**)
    let formattedText = text
      .split(/(\*\*.*?\*\*)/)
      .map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return `<strong>${boldText}</strong>`;
        }
        return part;
      })
      .join("");

    // Then handle italic text (*text*)
    formattedText = formattedText
      .split(/(\*[^*]+\*)/)
      .map((part, index) => {
        if (
          part.startsWith("*") &&
          part.endsWith("*") &&
          !part.startsWith("**")
        ) {
          const italicText = part.slice(1, -1);
          return `<em>${italicText}</em>`;
        }
        return part;
      })
      .join("");

    // Convert HTML tags to React elements
    const parts = formattedText.split(/(<strong>.*?<\/strong>|<em>.*?<\/em>)/);
    return parts.map((part, index) => {
      if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
        const boldText = part.slice(8, -9);
        return (
          <strong
            key={index}
            className="font-bold text-gray-900 dark:text-gray-100"
          >
            {boldText}
          </strong>
        );
      }
      if (part.startsWith("<em>") && part.endsWith("</em>")) {
        const italicText = part.slice(4, -5);
        return (
          <em key={index} className="italic text-gray-800 dark:text-gray-200">
            {italicText}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999 }}
        className="group rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white w-16 h-16 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-blue-500/25"
        aria-label="Open Planning System Help"
        title="Buka Bantuan Planning System"
      >
        <MessageCircle className="w-7 h-7 transition-transform group-hover:rotate-12" />
      </button>

      {/* Full screen page-like panel */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900"
        >
          <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-t-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Planning System Assistant
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Panduan lengkap untuk Planning System Berlindo
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900/20 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-all duration-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            {userInfo && (
              <div className="flex-shrink-0 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {userInfo.name || userInfo.username || "User"}
                  </span>
                  <span className="text-blue-500">•</span>
                  <span className="text-xs opacity-75">
                    {userInfo.role || userInfo.role_name || "User"}
                  </span>
                </div>
              </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-b-lg shadow-xl border border-gray-200/20 dark:border-gray-700/20 border-t-0 min-h-0">
              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 p-4 space-y-3 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(156, 163, 175, 0.5) transparent",
                }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl shadow-md ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-600/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {m.role === "assistant" && (
                          <Bot className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
                          {m.role === "assistant"
                            ? formatMessage(m.content)
                            : m.content}
                        </div>
                        {m.role === "user" && (
                          <User className="w-4 h-4 mt-0.5 text-white/80 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
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
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    placeholder="Tanya apa saja tentang Planning System..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Apa itu Planning System?",
                    "Cara tambah jadwal bulanan",
                    "Kenapa data duplikat saat simpan?",
                    "Cara update produksi harian",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
