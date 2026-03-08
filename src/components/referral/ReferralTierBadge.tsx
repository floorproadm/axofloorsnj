import { Star, Trophy } from 'lucide-react';
import { ReferralTier, getTierInfo } from '@/hooks/useReferralProfile';
import { cn } from '@/lib/utils';

interface Props {
  tier: ReferralTier;
  converted: number;
  className?: string;
}

export default function ReferralTierBadge({ tier, converted, className }: Props) {
  const info = getTierInfo(tier);
  const nextThreshold = info.next;
  const progress = nextThreshold ? (converted / nextThreshold) * 100 : 100;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        {tier === 'diamond' ? (
          <Trophy className={cn('w-6 h-6', info.color)} />
        ) : (
          Array.from({ length: Math.max(info.stars, 1) }).map((_, i) => (
            <Star
              key={i}
              className={cn('w-5 h-5', i < info.stars ? `${info.color} fill-current` : 'text-muted-foreground/30')}
            />
          ))
        )}
      </div>
      <span className={cn('text-sm font-semibold', info.color)}>{info.label}</span>
      {nextThreshold && (
        <div className="w-full max-w-[120px]">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            {converted}/{nextThreshold} to {getTierInfo(
              tier === 'starter' ? 'bronze' :
              tier === 'bronze' ? 'silver' :
              tier === 'silver' ? 'gold' : 'diamond'
            ).label}
          </p>
        </div>
      )}
    </div>
  );
}
