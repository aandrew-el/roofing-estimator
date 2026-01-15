'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { EstimateDisplay } from './EstimateDisplay';
import { WelcomeState } from './WelcomeState';
import { MessageSkeleton } from './MessageSkeleton';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { PhotoUpload } from './PhotoUpload';
import { PhotoAnalysisResult } from './PhotoAnalysisResult';
import { Estimate } from '@/lib/types';
import { useMessages } from '@/hooks/useConversations';
import { useCustomer } from '@/hooks/useCustomer';
import { useEstimate } from '@/hooks/useEstimate';
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis';
import { ArrowRight, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated: (title: string) => Promise<string | null>;
  onUpdateTitle: (id: string, title: string) => void;
  onTouch: (id: string) => void;
}

export function ChatInterface({
  conversationId,
  onConversationCreated,
  onUpdateTitle,
  onTouch,
}: ChatInterfaceProps) {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pendingEstimate, setPendingEstimate] = useState<Estimate | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstMessage = useRef(true);

  // Customer hook
  const { saveCustomer } = useCustomer();

  // Estimate hook
  const { saveEstimate, getEstimate } = useEstimate();

  // Database messages hook
  const { messages: dbMessages, addMessage, isLoading: messagesLoading } = useMessages(conversationId);

  // Photo analysis hook
  const {
    photo,
    status: photoStatus,
    analysis: photoAnalysis,
    error: photoError,
    handleUploadComplete,
    analyze: analyzePhoto,
    reset: resetPhoto,
    getAnalysisSummary,
  } = usePhotoAnalysis();

  // Photo upload UI state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Handle conversation change - reset state and load saved estimate
  useEffect(() => {
    if (conversationId !== activeConversationId) {
      setActiveConversationId(conversationId);
      setEstimate(null);
      setPendingEstimate(null);
      setShowCustomerModal(false);
      setCustomerName(null);
      setInput('');
      setShowPhotoUpload(false);
      resetPhoto();

      // For new chat (null conversationId), show welcome state
      if (!conversationId) {
        isFirstMessage.current = true;
        setLocalMessages([]);
        setShowWelcome(true);
      } else {
        // Loading existing conversation - hide welcome and load saved estimate
        setShowWelcome(false);

        // Load saved estimate for this conversation
        getEstimate(conversationId).then((savedEstimate) => {
          if (savedEstimate) {
            setEstimate(savedEstimate);
          }
        });
      }
    }
  }, [conversationId, activeConversationId, getEstimate, resetPhoto]);

  // Sync messages from database when they load
  useEffect(() => {
    // Only sync if we have a conversation and messages have loaded
    if (conversationId && !messagesLoading) {
      if (dbMessages.length > 0) {
        // Load messages from database
        setLocalMessages(
          dbMessages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        );
        isFirstMessage.current = false;
        setShowWelcome(false);
      } else {
        // Existing conversation with no messages yet - show welcome
        isFirstMessage.current = true;
        setLocalMessages([]);
        setShowWelcome(true);
      }
    }
  }, [conversationId, dbMessages, messagesLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  // Focus input on mount and conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    let currentConvId = conversationId;

    // Create conversation on first real message
    if (!currentConvId && isFirstMessage.current) {
      // Use first few words as title
      const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '');
      currentConvId = await onConversationCreated(title);
      if (!currentConvId) {
        console.error('Failed to create conversation');
        return;
      }
      isFirstMessage.current = false;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowWelcome(false);

    // Save user message to database (pass ID explicitly for race condition handling)
    if (currentConvId) {
      await addMessage('user', userContent, currentConvId);
      onTouch(currentConvId);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...localMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };

      setLocalMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database (pass ID explicitly for race condition handling)
      if (currentConvId) {
        await addMessage('assistant', data.message, currentConvId);
      }

      // If estimate was generated, show customer modal first
      if (data.estimate) {
        setPendingEstimate(data.estimate);
        setShowCustomerModal(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
      };
      setLocalMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setLocalMessages([]);
    setEstimate(null);
    setInput('');
    setShowWelcome(true);
    isFirstMessage.current = true;
    inputRef.current?.focus();
  }, []);

  // Handle clicking an example prompt from WelcomeState
  const handlePromptClick = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  // Handle customer details save
  const handleCustomerSave = useCallback(async (data: { name: string; email: string; phone?: string }) => {
    if (activeConversationId && pendingEstimate) {
      // Save customer, estimate, and send email in parallel
      const [, , emailResult] = await Promise.all([
        saveCustomer(activeConversationId, data),
        saveEstimate(activeConversationId, pendingEstimate),
        // Send email with estimate
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: data,
            estimate: pendingEstimate,
          }),
        }).then(res => res.json()).catch(() => ({ success: false })),
      ]);

      // Show toast feedback for email result
      if (emailResult.success) {
        toast.success(`Estimate sent to ${data.email}`);
      } else {
        toast.error('Failed to send estimate email. You can still download the PDF.');
        console.warn('Failed to send email:', emailResult.error);
      }
    }
    setCustomerName(data.name);
    setShowCustomerModal(false);
    setEstimate(pendingEstimate);
    setPendingEstimate(null);
  }, [activeConversationId, pendingEstimate, saveCustomer, saveEstimate]);

  // Handle customer details skip
  const handleCustomerSkip = useCallback(async () => {
    // Still save the estimate even if customer skips details
    if (activeConversationId && pendingEstimate) {
      await saveEstimate(activeConversationId, pendingEstimate);
    }
    setShowCustomerModal(false);
    setEstimate(pendingEstimate);
    setPendingEstimate(null);
  }, [activeConversationId, pendingEstimate, saveEstimate]);

  // Handle photo analysis complete - add summary to chat
  const handlePhotoAnalyzed = useCallback((photoId: string, imageUrl: string) => {
    analyzePhoto(photoId, imageUrl);
  }, [analyzePhoto]);

  // Use photo analysis in estimate context
  const handleUsePhotoData = useCallback(() => {
    const summary = getAnalysisSummary();
    if (summary && photoAnalysis) {
      // Pre-fill the input with analysis data for the user to send
      const prompt = `Based on my roof photo analysis:\n- Material: ${photoAnalysis.material}\n- Condition: ${photoAnalysis.condition}\n- Estimated area: ${photoAnalysis.estimatedAreaSqft ? `${photoAnalysis.estimatedAreaSqft} sq ft` : 'unknown'}\n\nPlease generate an estimate for this roof.`;
      setInput(prompt);
      setShowPhotoUpload(false);
      inputRef.current?.focus();
    }
  }, [getAnalysisSummary, photoAnalysis]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messagesLoading && conversationId ? (
          <MessageSkeleton count={3} />
        ) : showWelcome && localMessages.length === 0 ? (
          <WelcomeState onPromptClick={handlePromptClick} />
        ) : (
          <>
            {localMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && <TypingIndicator />}
            {estimate && <EstimateDisplay estimate={estimate} onReset={handleReset} customerName={customerName || undefined} conversationId={conversationId} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Photo Upload Panel */}
      {showPhotoUpload && !estimate && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Upload Roof Photo</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowPhotoUpload(false);
                  resetPhoto();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {photoStatus === 'idle' && (
              <PhotoUpload
                conversationId={conversationId}
                onUploadComplete={handleUploadComplete}
                onAnalyze={handlePhotoAnalyzed}
                disabled={isLoading}
              />
            )}
            {(photoStatus === 'pending' || photoStatus === 'analyzing' || photoStatus === 'completed' || photoStatus === 'failed') && (
              <div className="space-y-3">
                <PhotoAnalysisResult
                  status={photoStatus}
                  analysis={photoAnalysis}
                  error={photoError}
                  imageUrl={photo?.publicUrl}
                />
                {photoStatus === 'completed' && photoAnalysis && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowPhotoUpload(false);
                        resetPhoto();
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleUsePhotoData}
                    >
                      Use for Estimate
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input area - iOS style */}
      {!estimate && (
        <div className="px-4 py-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-2xl mx-auto bg-muted/50 dark:bg-muted/30 rounded-2xl px-2 py-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
              disabled={isLoading}
            >
              <Camera className="h-5 w-5" />
              <span className="sr-only">Upload photo</span>
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              disabled={isLoading}
              className="flex-1 h-10 text-[15px] bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground px-0"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 rounded-xl bg-accent hover:bg-accent-hover shrink-0 disabled:opacity-40 transition-all duration-200 active:scale-95"
            >
              <ArrowRight className="h-5 w-5 text-white" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={showCustomerModal}
        onSave={handleCustomerSave}
        onSkip={handleCustomerSkip}
      />
    </div>
  );
}
