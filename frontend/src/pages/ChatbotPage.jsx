import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2, Zap, MessageSquare } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  'What is my portfolio value?',
  'Which Nifty 50 stocks are trending?',
  'Explain PE ratio in simple terms',
  'Should I buy RELIANCE now?',
  'What is the risk in my portfolio?',
];

const markdownComponents = {
  h1: ({ node, ...props }) => <h1 className="text-lg font-black mt-3 mb-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm" style={{ color: 'var(--text-primary)' }} {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  li: ({ node, ...props }) => <li className="text-sm" style={{ color: 'var(--text-primary)' }} {...props} />,
  strong: ({ node, ...props }) => <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...props} />,
  a: ({ node, ...props }) => <a className="underline font-medium" style={{ color: 'var(--primary)' }} {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto mb-3"><table className="min-w-full text-xs border-collapse" {...props} /></div>,
  th: ({ node, ...props }) => <th className="px-3 py-2 font-bold text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }} {...props} />,
  td: ({ node, ...props }) => <td className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }} {...props} />,
  code: ({ node, inline, ...props }) => inline
    ? <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} {...props} />
    : <pre className="p-3 rounded-lg text-xs font-mono overflow-auto mb-3" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}><code {...props} /></pre>,
};

export default function ChatbotPage() {
  const { messages, loading, sendMessage, clearHistory } = useChatStore();
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div
        className="w-64 flex-shrink-0 flex flex-col border-r p-4 gap-4 hidden lg:flex"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>FinovaX AI</p>
              <p className="text-xs" style={{ color: 'var(--primary)' }}>●  Online</p>
            </div>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Your personalised Indian market AI. Ask about stocks, your portfolio, and more.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Quick Prompts</p>
          <div className="space-y-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition hover:border-green-300 hover:bg-green-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 size={13} /> Clear History
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={17} style={{ color: 'var(--primary)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Chat</span>
          </div>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)' }}>
                <Zap size={32} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>Ask FinovaX AI</h2>
              <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
                I have live access to your portfolio, wallet, and market data. Ask me anything!
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'var(--primary)' }}>
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-3"
                style={{
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                }}
              >
                {m.role === 'user' ? (
                  <p className="text-sm font-medium text-white">{m.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
                <Bot size={14} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '4px 18px 18px 18px' }}>
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about stocks, your portfolio, or market trends…"
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg transition disabled:opacity-40"
              style={{ background: input.trim() ? 'var(--primary)' : 'var(--bg-surface-2)' }}
            >
              <Send size={16} className={input.trim() ? 'text-white' : ''} style={!input.trim() ? { color: 'var(--text-muted)' } : {}} />
            </button>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            AI provides general information. Not financial advice.
          </p>
        </form>
      </div>
    </div>
  );
}
