'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { EstimateDetailView } from './EstimateDetailView';
import { SidebarToggle } from './SidebarToggle';
import { UserMenu } from './auth/UserMenu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';
import { useEstimateHistory } from '@/hooks/useEstimateHistory';
import { useAuth } from '@/hooks/useAuth';
import { Menu, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);

  const { user } = useAuth();

  const {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    touchConversation,
  } = useConversations();

  const {
    estimates,
    isLoading: estimatesLoading,
    deleteEstimate,
    refetch: refetchEstimates,
  } = useEstimateHistory();

  const handleSelectConversation = useCallback((id: string | null) => {
    setCurrentConversationId(id);
    setSelectedEstimateId(null); // Clear estimate view when selecting a conversation
    setMobileOpen(false);
  }, []);

  const handleSelectEstimate = useCallback((estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setCurrentConversationId(null); // Clear conversation when viewing estimate
    setMobileOpen(false);
  }, []);

  const handleBackFromEstimate = useCallback(() => {
    setSelectedEstimateId(null);
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setSelectedEstimateId(null); // Clear estimate view when starting new chat
    setMobileOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [deleteConversation, currentConversationId]);

  const handleConversationCreated = useCallback(async (title: string) => {
    const conversation = await createConversation(title);
    if (conversation) {
      setCurrentConversationId(conversation.id);
      return conversation.id;
    }
    return null;
  }, [createConversation]);

  const handleDeleteEstimate = useCallback(async (id: string) => {
    await deleteEstimate(id);
  }, [deleteEstimate]);

  // Sidebar content for mobile drawer
  const mobileSidebarContent = (
    <Sidebar
      isCollapsed={false}
      onToggle={() => setMobileOpen(false)}
      conversations={conversations}
      selectedId={currentConversationId}
      selectedEstimateId={selectedEstimateId}
      onSelect={handleSelectConversation}
      onSelectEstimate={handleSelectEstimate}
      onDelete={handleDeleteConversation}
      onRename={updateConversationTitle}
      onNewChat={handleNewChat}
      isLoading={isLoading}
      estimates={estimates}
      estimatesLoading={estimatesLoading}
      onDeleteEstimate={handleDeleteEstimate}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          conversations={conversations}
          selectedId={currentConversationId}
          selectedEstimateId={selectedEstimateId}
          onSelect={handleSelectConversation}
          onSelectEstimate={handleSelectEstimate}
          onDelete={handleDeleteConversation}
          onRename={updateConversationTitle}
          onNewChat={handleNewChat}
          isLoading={isLoading}
          estimates={estimates}
          estimatesLoading={estimatesLoading}
          onDeleteEstimate={handleDeleteEstimate}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border bg-background flex items-center px-4 shrink-0">
          <div className="flex items-center gap-3 w-full">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {mobileSidebarContent}
              </SheetContent>
            </Sheet>

            {/* Desktop toggle (when sidebar is collapsed) */}
            {sidebarCollapsed && (
              <SidebarToggle
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(false)}
                className="hidden md:flex"
              />
            )}

            {/* Title */}
            <div className="flex-1">
              <h1 className="text-sm font-medium text-foreground truncate">
                {selectedEstimateId
                  ? 'View Estimate'
                  : currentConversationId
                    ? conversations.find(c => c.id === currentConversationId)?.title || 'Estimate'
                    : 'New Estimate'
                }
              </h1>
            </div>

            {/* User menu or login button */}
            {user ? (
              <UserMenu />
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {selectedEstimateId ? (
            <EstimateDetailView
              estimateId={selectedEstimateId}
              onBack={handleBackFromEstimate}
            />
          ) : (
            <div className={cn(
              'h-full mx-auto transition-all duration-200',
              sidebarCollapsed ? 'max-w-4xl' : 'max-w-3xl'
            )}>
              <ChatInterface
                conversationId={currentConversationId}
                onConversationCreated={handleConversationCreated}
                onUpdateTitle={updateConversationTitle}
                onTouch={touchConversation}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
