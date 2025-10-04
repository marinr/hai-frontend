import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@/types';

interface UseAgentChatOptions {
  initialMessages?: Message[];
  responseDelayMs?: number;
}

const DEFAULT_AGENT_MESSAGE: Message = {
  id: 'agent-initial',
  type: 'agent',
  text: 'Hello! I can help you analyze bookings, find availability, or answer questions about your properties. What would you like to know?',
  timestamp: new Date(),
};

export function useAgentChat({
  initialMessages = [DEFAULT_AGENT_MESSAGE],
  responseDelayMs = 500,
}: UseAgentChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [agentInput, setAgentInput] = useState('');
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    const trimmedInput = agentInput.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setAgentInput('');

    responseTimeoutRef.current = setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: `I understand you're asking: "${trimmedInput}". This is a demo response. In a real implementation, I would analyze your booking data and provide insights about availability, revenue, occupancy rates, or answer specific questions about your properties.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    }, responseDelayMs);
  }, [agentInput, responseDelayMs]);

  return {
    messages,
    agentInput,
    setAgentInput,
    handleSendMessage,
    messagesEndRef,
  };
}
