/**
 * HireHand Insight AI — RAG-Powered Transcript Chatbot Widget
 * ════════════════════════════════════════════════════════════
 * 100% ISOLATED — This is a brand new component.
 * Does NOT modify any existing file or component.
 *
 * Premium floating chat widget for HR to ask questions about
 * a candidate's interview performance using RAG + GPT-4o-mini.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, Bot, User, ChevronDown,
  Zap, Brain, MessagesSquare, Target, Lightbulb
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/lib/api";
import "./InsightChatWidget.css";

// ── Types ──────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface Suggestion {
  text: string;
  category: string;
}

interface Props {
  candidateId: string;
  positionId: string;
  candidateName: string;
}

// ── Category Icons ─────────────────────────────────────────
const categoryIcon = (cat: string) => {
  switch (cat) {
    case "overview": return <Brain className="w-3.5 h-3.5" />;
    case "technical": return <Zap className="w-3.5 h-3.5" />;
    case "behavioral": return <MessagesSquare className="w-3.5 h-3.5" />;
    case "fit": return <Target className="w-3.5 h-3.5" />;
    case "decision": return <Lightbulb className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
};

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

export function InsightChatWidget({ candidateId, positionId, candidateName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Load suggestions when chat opens
  useEffect(() => {
    if (suggestions.length === 0) {
      loadSuggestions();
    }
  }, []);

  // Reset when candidate changes
  useEffect(() => {
    setMessages([]);
    setSuggestions([]);
    setShowSuggestions(true);
  }, [candidateId]);

  const loadSuggestions = async () => {
    try {
      const data = await apiFetch<{ suggestions: Suggestion[] }>(
        `/api/insight-chat/${candidateId}/suggestions`
      );
      setSuggestions(data.suggestions || []);
    } catch {
      // Silent fail — suggestions are optional
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await apiFetch<{
        answer: string;
        sources: string[];
        chunks_used: number;
      }>(`/api/insight-chat/${candidateId}/ask`, {
        method: "POST",
        body: JSON.stringify({
          question: text.trim(),
          position_id: positionId,
          chat_history: history,
        }),
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I couldn't process your question right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
      {/* ── Chat Panel ── */}
      <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="insight-chat-panel"
          >
            {/* ── Header ── */}
            <div className="insight-chat-header">
              <div className="insight-chat-header-info">
                <div className="insight-chat-header-avatar">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="insight-chat-header-title">HireHand Insight AI</h3>
                  <p className="insight-chat-header-subtitle">
                    Ask anything about {candidateName}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="insight-chat-messages">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="insight-chat-welcome">
                  <div className="insight-chat-welcome-icon">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4>Candidate Intelligence Assistant</h4>
                  <p>
                    I have access to {candidateName}'s interview transcripts,
                    resume analysis, and AI scores. Ask me anything!
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && messages.length === 0 && (
                <div className="insight-chat-suggestions">
                  <p className="insight-chat-suggestions-label">Suggested questions:</p>
                  <div className="insight-chat-suggestions-grid">
                    {suggestions.slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s.text)}
                        className="insight-chat-suggestion-chip"
                        title={s.text}
                      >
                        {categoryIcon(s.category)}
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`insight-chat-msg ${
                    msg.role === "user" ? "insight-chat-msg-user" : "insight-chat-msg-ai"
                  }`}
                >
                  <div className="insight-chat-msg-avatar">
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className="insight-chat-msg-content">
                    <div className="insight-chat-msg-text">
                      {msg.role === "ai" ? (
                        <div className="insight-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                      )}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="insight-chat-msg-sources">
                        {msg.sources.slice(0, 4).map((s, j) => (
                          <span key={j} className="insight-chat-source-tag">
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="insight-chat-msg insight-chat-msg-ai">
                  <div className="insight-chat-msg-avatar">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="insight-chat-msg-content">
                    <div className="insight-chat-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <form onSubmit={handleSubmit} className="insight-chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this candidate..."
                className="insight-chat-input"
                disabled={isLoading}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="insight-chat-send"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </motion.div>
      </AnimatePresence>
    </>
  );
}
