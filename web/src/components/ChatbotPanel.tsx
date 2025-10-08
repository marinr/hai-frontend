import React, { useState } from 'react';
import { ChevronDown, MessageCircle, Send, Sparkles } from 'lucide-react';

import Panel from '@/components/Panel';

interface ChatbotPanelProps {
  className?: string;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftMessage.trim()) {
      return;
    }
    setDraftMessage('');
  };

  const wrapperClassName = ['fixed bottom-6 right-6 z-40', className].filter(Boolean).join(' ');

  const panelClassName = [
    'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out',
    isOpen
      ? 'w-[90vw] max-w-sm sm:max-w-md lg:max-w-lg p-4 max-h-[70vh]'
      : 'h-14 w-14 sm:h-16 sm:w-16 p-0'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClassName}>
      <Panel padding={false} className={panelClassName}>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className={`flex items-center ${
            isOpen ? 'justify-between gap-4 text-left' : 'h-full w-full justify-center'
          }`}
        >
          {isOpen ? (
            <>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Hai Agent</h2>
                  <p className="text-xs text-gray-500">Quick answers, daily guidance.</p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </>
          ) : (
            <>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="sr-only">Open Hai Agent</span>
            </>
          )}
        </button>

        {isOpen && (
          <>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto text-sm">
              <div className="space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                    HAI assistant
                  </div>
                  <p className="mt-2 leading-relaxed">
                    Hi there! I can highlight urgent arrivals, staffing gaps, and guest notes. Ask me anything about today&apos;s
                    operations.
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
                  Try asking: “What arrivals should I prioritize today?”
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
              <input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Type a message to HAI assistant…"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/60"
              />
              <button
                type="submit"
                disabled={!draftMessage.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/60 disabled:opacity-60"
              >
                <Send className="h-4 w-4" strokeWidth={2.5} />
                Send
              </button>
            </form>
          </>
        )}
      </Panel>
    </div>
  );
};

export default ChatbotPanel;
