'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, Zap, ShieldCheck, Star, Truck, RefreshCw, MessageSquare } from 'lucide-react';

export function AIChatView() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Rajesh! I am your ProcureAI Assistant. Ask me anything about solar component prices, supplier ratings, lead times, or low-stock alerts.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const quickPrompts = [
    'Find cheapest 550W panel',
    'Fastest delivery for inverters',
    'Compare all connector suppliers',
    'Which items are low in stock?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      const json = await res.json();

      if (json.success) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: json.data.answerText,
          structuredData: json.data.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Error in AI Chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            AI Procurement Assistant <Sparkles className="h-4 w-4 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">Natural language search, price optimization & vendor intelligence</p>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="h-3 w-3 text-cyan-400" /> Quick Prompts:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs md:text-sm space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                <span>{msg.sender === 'user' ? 'Rajesh (Purchase Manager)' : 'ProcureAI Assistant'}</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

              {/* Structured AI Recommendation Badges */}
              {msg.structuredData &&
                msg.structuredData.map((item: any, idx: number) => {
                  const top = item.topRecommendation;
                  if (!top) return null;
                  return (
                    <div key={idx} className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{top.productName}</span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          AI Composite Score: {top.compositeScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-lg bg-slate-900">
                          <span className="text-slate-400 block">Supplier</span>
                          <span className="font-semibold text-slate-200 truncate block">{top.supplierName}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900">
                          <span className="text-slate-400 block">Effective Price</span>
                          <span className="font-extrabold text-emerald-400">₹{top.effectivePrice}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900">
                          <span className="text-slate-400 block">Lead Time</span>
                          <span className="font-semibold text-slate-200">{top.leadTime} Days</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900">
                          <span className="text-slate-400 block">Rating</span>
                          <span className="font-bold text-purple-300">⭐ {top.rating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin" />
              <span>Analyzing supplier database & scoring offers...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="relative shrink-0">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI: e.g. 'Show cheapest 550W panel', 'Find fast delivery inverter'..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-4 pr-12 py-3.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none shadow-xl"
        />
        <button
          onClick={() => handleSend()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:scale-105 transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
