'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { SidebarToggle } from './SidebarToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    touchConversation,
  } = useConversations();

  const handleSelectConversation = useCallback((id: string | null) => {
    setCurrentConversationId(id);
    setMobileOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
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

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <Sidebar
      isCollapsed={false}
      onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      conversations={conversations}
      selectedId={currentConversationId}
      onSelect={handleSelectConversation}
      onDelete={handleDeleteConversation}
      onNewChat={handleNewChat}
      isLoading={isLoading}
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
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onNewChat={handleNewChat}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-background flex items-center px-4 shrink-0">
          <div className="flex items-center gap-3 w-full">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                {sidebarContent}
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
              <h1 className="text-base font-semibold text-foreground">
                {currentConversationId
                  ? conversations.find(c => c.id === currentConversationId)?.title || 'Estimate'
                  : 'New Estimate'
                }
              </h1>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <main className="flex-1 overflow-hidden">
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
        </main>
      </div>
    </div>
  );
}
