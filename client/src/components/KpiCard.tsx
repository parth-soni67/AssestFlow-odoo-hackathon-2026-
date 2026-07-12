/**
 * KpiCard — shared metric card, used on Dashboard and Reports.
 *
 * DESIGN_GUIDE §4 — exact two-row structure:
 *
 *   ┌────────────────────────────────┐
 *   │ Label text            [●icon●] │  row 1: flex space-between, center-aligned
 *   │                                │  icon badge: fixed 32×32px, icon 16px inside
 *   │ 1,234                          │  row 2: --text-2xl bold, margin-top 12px
 *   └────────────────────────────────┘
 *
 * Rules:
 * - Icon badge and number are NEVER on the same visual line.
 * - Icon is NEVER centred over or behind the label.
 * - Label wraps if long — it is never truncated.
 * - Card padding: 24px. Border-radius: 6px. No gradients.
 * - Icon badge colour derives from the `tier` prop (uses the same
 *   status-tier colour system as StatusBadge).
 */


import type { LucideIcon } from 'lucide-react';
import type { StatusTier } from './StatusBadge';

// Re-export so callers can import from one place if needed.
export type { StatusTier };

const tierIconClasses: Record<StatusTier, { bg: string; icon: string }> = {
  success: { bg: 'bg-success-subtle', icon: 'text-success' },
  info:    { bg: 'bg-info-subtle',    icon: 'text-info'    },
  warning: { bg: 'bg-warning-subtle', icon: 'text-warning' },
  alert:   { bg: 'bg-alert-subtle',   icon: 'text-alert'   },
  danger:  { bg: 'bg-danger-subtle',  icon: 'text-danger'  },
  neutral: { bg: 'bg-neutral-subtle', icon: 'text-neutral-status' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tier: StatusTier;
  loading?: boolean;
  className?: string;
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  tier,
  loading = false,
  className = '',
}: KpiCardProps) {
  const { bg, icon: iconText } = tierIconClasses[tier];

  return (
    <div
      className={[
        // Structure: 24px padding, 6px radius, white surface, card shadow
        'bg-surface border border-border rounded p-6 shadow-card',
        // Layout: flex column, stretch to fill grid cell
        'flex flex-col',
        className,
      ].join(' ')}
    >
      {/* ── Row 1: label (left) + icon badge (right) ── */}
      <div className="flex items-start justify-between gap-2">
        {/*
          Label: text-xs (12px/500) per DESIGN_GUIDE §2 badge/meta role.
          Wraps naturally — never truncated, never overlapping badge.
        */}
        <span className="text-xs font-semibold text-text-secondary leading-snug">
          {label}
        </span>

        {/*
          Icon badge: fixed 32×32px container.
          Icon inside is 16px — never larger (DESIGN_GUIDE §3).
        */}
        <span
          className={[
            'flex items-center justify-center shrink-0 rounded',
            'w-8 h-8',  // 32×32px using spacing-8=32px token
            bg,
          ].join(' ')}
          aria-hidden="true"
        >
          <Icon className={`w-4 h-4 ${iconText}`} />  {/* 16px icon */}
        </span>
      </div>

      {/* ── Row 2: metric value ── margin-top 12px per DESIGN_GUIDE §4 */}
      <div className="mt-3">
        {loading ? (
          <span className="text-sm text-text-muted">—</span>
        ) : (
          <span className="text-2xl font-bold text-text-primary tabular-nums">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
