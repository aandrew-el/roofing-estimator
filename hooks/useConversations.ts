'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from './useSession';
import type { Conversation, Message } from '@/lib/database.types';

export function useConversations() {
  const { sessionId, isLoading: sessionLoading } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations for this session
  const fetchConversations = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionId,
          title: title || 'New Estimate',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setConversations(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  }, [sessionId]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c))
      );
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  }, []);

  // Touch conversation (update updated_at)
  const touchConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state and reorder
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === id ? { ...c, updated_at: new Date().toISOString() } : c
        );
        return updated.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    } catch (err) {
      console.error('Error touching conversation:', err);
    }
  }, []);

  // Fetch on session load
  useEffect(() => {
    if (!sessionLoading && sessionId) {
      fetchConversations();
    }
  }, [sessionId, sessionLoading, fetchConversations]);

  return {
    conversations,
    isLoading: isLoading || sessionLoading,
    error,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    touchConversation,
    refetch: fetchConversations,
  };
}

// Hook to get messages for a specific conversation
export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for the conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Add a message
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message | null> => {
    if (!conversationId) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setMessages(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, [conversationId]);

  // Clear messages (for new conversation)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Fetch on conversation change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    clearMessages,
    refetch: fetchMessages,
  };
}
