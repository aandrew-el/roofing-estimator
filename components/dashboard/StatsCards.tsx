'use client';

import { useEstimateHistory } from '@/hooks/useEstimateHistory';
import { useConversations } from '@/hooks/useConversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, DollarSign, Clock } from 'lucide-react';

export function StatsCards() {
  const { estimates, isLoading: estimatesLoading } = useEstimateHistory();
  const { conversations, isLoading: conversationsLoading } = useConversations();

  const isLoading = estimatesLoading || conversationsLoading;

  // Calculate stats
  const totalEstimates = estimates.length;
  const totalConversations = conversations.length;
  const totalRevenue = estimates.reduce(
    (sum, est) => sum + (est.totalAmount || 0),
    0
  );
  const sentEstimates = estimates.filter(
    (est) => est.status === 'sent' || est.status === 'viewed' || est.status === 'accepted'
  ).length;

  const stats = [
    {
      title: 'Total Estimates',
      value: isLoading ? '-' : totalEstimates.toString(),
      icon: FileText,
      description: 'All time',
    },
    {
      title: 'Total Value',
      value: isLoading
        ? '-'
        : `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Sum of estimates',
    },
    {
      title: 'Conversations',
      value: isLoading ? '-' : totalConversations.toString(),
      icon: MessageSquare,
      description: 'Chat sessions',
    },
    {
      title: 'Sent to Customers',
      value: isLoading ? '-' : sentEstimates.toString(),
      icon: Clock,
      description: 'Estimates shared',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
