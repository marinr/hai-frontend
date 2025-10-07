import React from 'react';
import { Send, X } from 'lucide-react';
import type { Message } from '@/types';

interface AgentChatPanelProps {
  messages: Message[];
  agentInput: string;
  onAgentInputChange: (value: string) => void;
  onSendMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
  title?: string;
  onClose?: () => void;
}

const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  messages,
  agentInput,
  onAgentInputChange,
  onSendMessage,
  messagesEndRef,
  className,
  title = 'Agent Assistant',
  onClose,
}) => {
  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <span className="font-semibold text-gray-700">{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Collapse Agent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.text}</div>
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about bookings, availability..."
            value={agentInput}
            onChange={(event) => onAgentInputChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={onSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatPanel;
