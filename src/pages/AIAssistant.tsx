// ══════════════════════════════════════════════════════
// SENTINEL — AI Assistant Page
// ChatGPT-style intelligent traffic analysis interface
// ══════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type FormEvent } from 'react';
import vi from '../i18n/vi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  SendHorizontal,
  Mic,
  MicOff,
  Trash2,
  Sparkles,
  CircleDot,
  Zap,
  Shield,
  Radio,
  MessageSquare,
} from 'lucide-react';
import type { ChatMessage } from '../types';

// ── Inline AI response strings (no mock imports) ──
const chatResponses = {
  traffic: `🚦 **Tình hình Giao thông Nguyễn Trãi**

Hiện tại AI đang phân tích dữ liệu từ hệ thống.

• Tải lên video để nhận phân tích chi tiết
• Hệ thống sẽ tự động nhận diện phương tiện
• Thống kê sẽ cập nhật theo thời gian thực`,
  violation: `📋 **Báo cáo Vi phạm**

Dữ liệu vi phạm sẽ được tạo tự động từ AI inference.

• Tải video lên trang Giám sát Trực tiếp
• AI sẽ phát hiện vi phạm tự động
• Kết quả OCR biển số sẽ hiển thị tại trang Vi phạm`,
  default: `🤖 Tôi là SENTINEL AI. Hiện tại tôi hoạt động dựa trên dữ liệu AI thực từ model YOLOv8.

Bạn có thể:
• Tải video lên để bắt đầu phân tích
• Xem kết quả nhận diện trực tiếp
• Kiểm tra thống kê tại trang Dashboard`,
};

// ── Helpers ─────────────────────────────────────────

const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const formatTime = (d: Date) =>
  d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ── Suggestion Chips ────────────────────────────────

const SUGGESTIONS = [
  { label: 'Tình hình giao thông Nguyễn Trãi?', icon: Radio },
  { label: 'Báo cáo vi phạm hôm nay', icon: Shield },
  { label: 'Trạng thái đội drone', icon: Zap },
  { label: 'Dự đoán ùn tắc giờ cao điểm', icon: Sparkles },
];

// ── Welcome message ─────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Xin chào! Tôi là **SENTINEL AI** — trợ lý phân tích giao thông thông minh.

Tôi có thể giúp bạn:
• Phân tích tình hình giao thông realtime
• Dự đoán ùn tắc và đề xuất tuyến thay thế
• Báo cáo vi phạm và thống kê
• Quản lý đội drone

Hãy hỏi tôi bất cứ điều gì!`,
  timestamp: formatTime(new Date()),
};

// ── Keyword matching for AI responses ───────────────

function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('nguyễn trãi') || lower.includes('nguyen trai') || lower.includes('giao thông')) {
    return chatResponses.traffic;
  }
  if (lower.includes('vi phạm') || lower.includes('vi pham') || lower.includes('báo cáo')) {
    return chatResponses.violation;
  }
  if (lower.includes('drone') || lower.includes('trạng thái')) {
    return `🤖 **Trạng thái Đội Drone SENTINEL**

Hiện tại hệ thống đang quản lý 5 drone:

• **D-01 Sentinel Alpha** — 🟢 Đang hoạt động
  Khu vực: Nguyễn Trãi | Pin: 82% | Độ cao: 120m

• **D-02 Sentinel Bravo** — 🟢 Đang hoạt động
  Khu vực: Lê Lợi × Hàm Nghi | Pin: 65% | Độ cao: 140m

• **D-03 Sentinel Charlie** — 🟡 Đang quay về
  Pin thấp: 15% | Dự kiến về base trong 8 phút

• **D-04 Sentinel Delta** — ⚪ Chờ lệnh
  Pin: 100% | Sẵn sàng triển khai

• **D-05 Sentinel Echo** — 🟢 Đang hoạt động
  Khu vực: Điện Biên Phủ | Pin: 71% | Độ cao: 110m

📡 Tín hiệu tổng thể: **Tốt** (92% trung bình)`;
  }
  if (lower.includes('ùn tắc') || lower.includes('dự đoán') || lower.includes('cao điểm')) {
    return `⏱️ **Dự đoán Ùn tắc Giờ Cao Điểm**

Dựa trên AI phân tích dữ liệu 30 ngày:

🔴 **17:00 — 18:30**: Ùn tắc nghiêm trọng
• Nguyễn Trãi: 85% công suất
• Cách Mạng Tháng 8: 72% công suất
• Điện Biên Phủ: 68% công suất

🟡 **18:30 — 19:30**: Ùn tắc trung bình
• Dự kiến giảm dần từ 19:00

🟢 **Sau 19:30**: Giao thông ổn định

💡 **Đề xuất**: 
• Triển khai D-04 từ 16:30 tại Nguyễn Trãi
• Chuyển D-05 sang khu vực Cách Mạng Tháng 8
• Kích hoạt chế độ giám sát tăng cường`;
  }

  return chatResponses.default;
}

// ── Markdown-like renderer ──────────────────────────

function renderMessageContent(content: string) {
  const lines = content.split('\n');

  return lines.map((line, i) => {
    // Empty line = spacer
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }

    // Process bold markers **text**
    const renderBoldText = (text: string) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={j} className="font-semibold text-white">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={j}>{part}</span>;
      });
    };

    // Bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      const indent = line.startsWith('  ') ? 'ml-4' : 'ml-1';
      const bullet = line.trim().startsWith('•') ? line.trim().slice(1).trim() : line.trim().slice(1).trim();
      return (
        <div key={i} className={`flex items-start gap-2 ${indent} py-0.5`}>
          <span className="text-cyan-400 mt-1.5 text-[6px]">●</span>
          <span className="text-slate-300 text-sm leading-relaxed">{renderBoldText(bullet)}</span>
        </div>
      );
    }

    // Numbered list
    if (/^\d+\./.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1];
      const text = line.trim().replace(/^\d+\.\s*/, '');
      return (
        <div key={i} className="flex items-start gap-2 ml-1 py-0.5">
          <span className="text-cyan-400 text-xs font-mono font-bold mt-0.5">{num}.</span>
          <span className="text-slate-300 text-sm leading-relaxed">{renderBoldText(text)}</span>
        </div>
      );
    }

    // Header-like lines (emoji at start)
    const hasEmoji = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/u.test(line.trim());
    if (hasEmoji && line.includes('**')) {
      return (
        <div key={i} className="text-sm font-medium text-slate-200 pt-1 pb-0.5 leading-relaxed">
          {renderBoldText(line.trim())}
        </div>
      );
    }

    // Default text
    return (
      <div key={i} className="text-sm text-slate-300 leading-relaxed">
        {renderBoldText(line)}
      </div>
    );
  });
}

// ── Typing Indicator ────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Dots */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl rounded-bl-sm px-5 py-3.5 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-cyan-400/60"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Message Bubble ──────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-3 px-4 py-1.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.03 + 0.1 }}
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/30'
            : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-cyan-300" />
        ) : (
          <Bot className="w-4 h-4 text-cyan-400" />
        )}
      </motion.div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 ${
            isUser
              ? 'bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-br-sm text-sm text-slate-200 leading-relaxed'
              : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl rounded-bl-sm shadow-[0_0_15px_rgba(0,212,255,0.05)]'
          }`}
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="space-y-0">{renderMessageContent(message.content)}</div>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] font-mono text-slate-500 px-1 ${isUser ? 'text-right self-end' : 'text-left self-start'}`}
        >
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
}

// ── Scanline Overlay ────────────────────────────────

function ScanlineOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-[0.015]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════

export default function AIAssistant() {
  // ── State ───────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ─────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ── Send message handler ────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const now = new Date();

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: formatTime(now),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 1000 + Math.random() * 500;
    setTimeout(() => {
      const aiContent = getAIResponse(trimmed);
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiContent,
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [input, isTyping]);

  // ── Keyboard handler ────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Suggestion click ────────────────────────────
  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // ── Clear chat ──────────────────────────────────
  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setIsTyping(false);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  // ── Animations ──────────────────────────────────
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.08 },
    },
  };

  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  const inputVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] } },
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col h-full min-h-[calc(100vh-8rem)] relative"
    >
      <ScanlineOverlay />

      {/* ── CHAT HEADER ──────────────────────────── */}
      <motion.div
        variants={headerVariants}
        className="flex-shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-5 py-3.5 mx-1 mb-3 flex items-center justify-between"
      >
        {/* Left */}
        <div className="flex items-center gap-3.5">
          {/* AI Avatar */}
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(0,212,255,0.0)',
                  '0 0 20px rgba(0,212,255,0.3)',
                  '0 0 0px rgba(0,212,255,0.0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <Bot className="w-5 h-5 text-cyan-400" />
            </motion.div>
            {/* Online dot */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white uppercase">SENTINEL AI</h1>
              <CircleDot className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{vi.header.online}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {vi.assistant.subtitle}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Voice mode toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
              voiceMode
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/10'
            }`}
          >
            {voiceMode ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Giọng nói</span>
          </motion.button>

          {/* Clear chat */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all duration-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{vi.assistant.clearChat}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── MESSAGES AREA ────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {/* Gradient overlays */}
        <div className="sticky top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

        <div className="py-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-2" />

        <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
      </div>

      {/* ── SUGGESTION CHIPS ─────────────────────── */}
      <motion.div
        variants={inputVariants}
        className="flex-shrink-0 px-4 py-2 flex flex-wrap gap-2"
      >
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileHover={{
                scale: 1.04,
                borderColor: 'rgba(0,212,255,0.4)',
                boxShadow: '0 0 12px rgba(0,212,255,0.1)',
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSuggestion(s.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] backdrop-blur border border-cyan-500/15 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors duration-300 cursor-pointer"
            >
              <Icon className="w-3 h-3 text-cyan-500/50" />
              {s.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── INPUT AREA ───────────────────────────── */}
      <motion.div variants={inputVariants} className="flex-shrink-0 px-1 pb-1">
        <form
          onSubmit={handleFormSubmit}
          className="group bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-500 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_30px_rgba(0,212,255,0.08)]"
        >
          {/* Message icon */}
          <MessageSquare className="w-4.5 h-4.5 text-slate-600 flex-shrink-0" />

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={vi.assistant.placeholder}
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50 caret-cyan-400"
          />

          {/* Voice button */}
          {voiceMode && (
            <motion.button
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all flex-shrink-0"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              input.trim()
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]'
                : 'bg-white/[0.03] border border-white/[0.06] text-slate-600'
            }`}
          >
            <SendHorizontal className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Subtle footer */}
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-1">
          <div className="w-1 h-1 rounded-full bg-cyan-500/20" />
          <span className="text-[9px] tracking-widest text-slate-600 uppercase font-mono">
            Sentinel AI v3.2 — Hệ thống Phân tích Giao thông Thần kinh
          </span>
          <div className="w-1 h-1 rounded-full bg-cyan-500/20" />
        </div>
      </motion.div>
    </motion.div>
  );
}
