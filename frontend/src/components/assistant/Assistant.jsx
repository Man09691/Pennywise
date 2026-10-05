import { useState, useRef, useEffect } from "react";
import { apiRequest } from "../../services/api";
import { Bot, X, Send, Sparkles } from "lucide-react";

function TypingIndicator() {
  return (
    <div className="assistant-message assistant typing-indicator-wrapper">
      <div className="assistant-avatar">
        <Bot size={14} />
      </div>
      <div className="assistant-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function Message({ item }) {
  const isUser = item.role === "user";
  return (
    <div className={`assistant-message ${item.role}`}>
      {!isUser && (
        <div className="assistant-avatar">
          <Bot size={14} />
        </div>
      )}
      <div className="assistant-bubble">
        <p>{item.content}</p>
        {item.time && <span className="message-time">{item.time}</span>}
      </div>
      {isUser && <div className="user-avatar">You</div>}
    </div>
  );
}

function Assistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  /* Auto-scroll to bottom whenever messages or loading state changes */
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const getNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = async () => {
    const text = message.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text, time: getNow() };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const result = await apiRequest("/assistant", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, time: getNow() },
      ]);
    } catch (error) {
      console.error("AI request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again.",
          time: getNow(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Chat Panel ── */}
      <div className={`assistant-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="assistant-header">
          <div className="assistant-header-info">
            <div className="assistant-header-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="assistant-header-title">Pennywise AI</span>
              <span className="assistant-header-status">
                <span className="status-dot" />
                Online
              </span>
            </div>
          </div>
          <button
            type="button"
            className="assistant-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="assistant-body" ref={bodyRef}>
          {/* Welcome state */}
          {messages.length === 0 && !isLoading && (
            <div className="assistant-welcome">
              <div className="assistant-welcome-icon">
                <Bot size={28} />
              </div>
              <p className="assistant-welcome-title">Hi, I'm Pennywise AI!</p>
              <p className="assistant-welcome-sub">
                Ask me about your expenses, income, budgets, or any financial
                question.
              </p>
              <div className="assistant-suggestions">
                {[
                  "How much did I spend this month?",
                  "Show my top categories",
                  "Am I over budget?",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((item, index) => (
            <Message key={index} item={item} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}
        </div>

        {/* Input area */}
        <div className="assistant-input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Pennywise AI…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            type="button"
            className={`assistant-send-btn ${isLoading ? "loading" : ""}`}
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ── FAB Toggle Button ── */}
      <button
        type="button"
        className={`assistant-button ${isOpen ? "active" : ""}`}
        title="Open Pennywise AI Assistant"
        onClick={() => setIsOpen((c) => !c)}
        aria-label="Toggle AI assistant"
      >
        <span className="assistant-button-inner">
          {isOpen ? <X size={22} /> : <Bot size={22} />}
        </span>
        {!isOpen && <span className="assistant-button-pulse" />}
      </button>
    </>
  );
}

export default Assistant;
