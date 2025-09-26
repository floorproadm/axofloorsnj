import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  description,
  isLoading = false,
  className
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            {description && <div className="h-4 bg-muted animate-pulse rounded w-3/4" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            {change !== undefined && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs w-fit", getTrendColor())}
              >
                {getTrendIcon()}
                <span className="ml-1">
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </Badge>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground leading-tight line-clamp-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsGridProps {
  cards: StatsCardProps[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsCardsGrid({ 
  cards, 
  isLoading = false, 
  columns = 4,
  className 
}: StatsCardsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {cards.map((card, index) => (
        <StatsCard
          key={`${card.title}-${index}`}
          {...card}
          isLoading={isLoading}
          className="min-h-[110px]"
        />
      ))}
    </div>
  );
}