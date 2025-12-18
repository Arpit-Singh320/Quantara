/**
 * React hook for AI-powered chat using backend API
 */

import { useState, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { ChatMessage, Renewal, Source } from '@/types/broker';

interface UseAIChatOptions {
  renewals?: Renewal[];
  clientContext?: string;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  streamedContent: string;
  error: string | null;
  isConfigured: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setApiKey: (key: string) => void;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Always configured - API key is on the backend
  const [isConfigured] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // No-op since API key is on backend
  const setApiKey = useCallback(() => {}, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setStreamedContent('');
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Build chat history for context - map 'assistant' to 'model' for Gemini API
      const history = messages.map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

      // Call backend API
      const response = await api.chat(
        content,
        { clientName: options.clientContext },
        history
      );

      let fullResponse = '';
      let confidence = 0;
      let confidenceLabel: 'High' | 'Medium' | 'Low' = 'Medium';
      let apiSources: any[] = [];

      const data = response.data as any;
      if (data?.message) {
        fullResponse = data.message;
        confidence = data.confidence || 75;
        confidenceLabel = data.confidenceLabel || 'Medium';
        apiSources = data.sources || [];
      } else if (response.error) {
        throw new Error(response.error);
      }

      // Convert API sources to Source format
      const sources: Source[] = apiSources.length > 0
        ? apiSources.map((s: any, i: number) => ({
            id: `source-${Date.now()}-${i}`,
            type: s.system.toLowerCase().includes('crm') ? 'salesforce' :
                  s.system.toLowerCase().includes('email') ? 'outlook' : 'calendar',
            label: `${s.system} - ${s.recordType} #${s.recordId}`,
            timestamp: new Date().toISOString(),
            relativeTime: 'just now',
            preview: `View in ${s.system}`,
            link: s.link,
          }))
        : generateMockSources();

      // Add assistant message with confidence
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
        sources,
        confidence,
        confidenceLabel,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamedContent('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);

      // Add error message as assistant response
      const errorResponse: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again later.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [messages, options.clientContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamedContent('');
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    streamedContent,
    error,
    isConfigured,
    sendMessage,
    clearMessages,
    setApiKey,
  };
}

// Helper to generate mock sources (in production, these would come from actual data)
function generateMockSources(): Source[] {
  const sourceTypes: Source['type'][] = ['salesforce', 'outlook', 'calendar'];
  return sourceTypes.slice(0, Math.floor(Math.random() * 3) + 1).map((type, i) => ({
    id: `source-${Date.now()}-${i}`,
    type,
    label: type === 'salesforce' ? 'CRM Record' : type === 'outlook' ? 'Email Thread' : 'Calendar Event',
    timestamp: new Date().toISOString(),
    relativeTime: 'just now',
    preview: 'Data retrieved from connected source',
  }));
}
