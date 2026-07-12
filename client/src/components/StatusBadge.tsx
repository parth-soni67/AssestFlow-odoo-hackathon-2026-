/**
 * StatusBadge — single source of truth for status → colour mapping.
 *
 * DESIGN_GUIDE §1: "a given state always uses the same color everywhere in
 * the app". This component is the only place that mapping is defined.
 * Import it wherever a status appears — asset table, KPI, calendar entry,
 * notification — never duplicate the colour logic per screen.
 *
 * Colour map (exact from DESIGN_GUIDE §1):
 *   Available / Verified / Resolved / Approved  → success  (#1E8E5A, tint #E6F6EE)
 *   Allocated / InProgress / Ongoing             → info     (#2F5DE0, tint #EAF0FE)
 *   Reserved / Pending / Upcoming                → warning  (#B4740E, tint #FBF0DD)
 *   UnderMaintenance / Overdue / Damaged         → alert    (#C24B1F, tint #FCEAE1)
 *   Lost / Rejected / Missing                    → danger   (#C1352E, tint #FBEAE9)
 *   Retired / Disposed / Cancelled               → neutral  (#6B7280, tint #EEF0F3)
 */



export type StatusValue =
  | 'Available' | 'Verified' | 'Resolved' | 'Approved'
  | 'Allocated' | 'InProgress' | 'Ongoing' | 'TechnicianAssigned'
  | 'Reserved'  | 'Pending'   | 'Upcoming'
  | 'UnderMaintenance' | 'Overdue' | 'Damaged'
  | 'Lost' | 'Rejected' | 'Missing'
  | 'Retired' | 'Disposed' | 'Cancelled'
  | string; // fallback — unknown statuses render neutral

export type StatusTier = 'success' | 'info' | 'warning' | 'alert' | 'danger' | 'neutral';

/** Map a raw status string to a semantic tier. */
export function getStatusTier(status: StatusValue): StatusTier {
  switch (status) {
    case 'Available':
    case 'Verified':
    case 'Resolved':
    case 'Approved':
      return 'success';

    case 'Allocated':
    case 'InProgress':
    case 'Ongoing':
    case 'TechnicianAssigned':
      return 'info';

    case 'Reserved':
    case 'Pending':
    case 'Upcoming':
      return 'warning';

    case 'UnderMaintenance':
    case 'Overdue':
    case 'Damaged':
      return 'alert';

    case 'Lost':
    case 'Rejected':
    case 'Missing':
      return 'danger';

    case 'Retired':
    case 'Disposed':
    case 'Cancelled':
    default:
      return 'neutral';
  }
}

/** Tailwind class pairs (bg + text) keyed by tier. Uses CSS var tokens only. */
const tierClasses: Record<StatusTier, { bg: string; text: string; border: string }> = {
  success: {
    bg:     'bg-success-subtle',
    text:   'text-success',
    border: 'border-success',
  },
  info: {
    bg:     'bg-info-subtle',
    text:   'text-info',
    border: 'border-info',
  },
  warning: {
    bg:     'bg-warning-subtle',
    text:   'text-warning',
    border: 'border-warning',
  },
  alert: {
    bg:     'bg-alert-subtle',
    text:   'text-alert',
    border: 'border-alert',
  },
  danger: {
    bg:     'bg-danger-subtle',
    text:   'text-danger',
    border: 'border-danger',
  },
  neutral: {
    bg:     'bg-neutral-subtle',
    text:   'text-neutral-status',
    border: 'border-border',
  },
};

interface StatusBadgeProps {
  status: StatusValue;
  /** Override the display label (defaults to the raw status string). */
  label?: string;
  className?: string;
}

/**
 * Renders a pill-shaped status badge.
 * Always pairs colour with a text label (accessibility — DESIGN_GUIDE §5).
 */
export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const tier   = getStatusTier(status);
  const colors = tierClasses[tier];
  const text   = label ?? status;

  return (
    <span
      className={[
        'inline-flex items-center rounded-badge px-2 py-1',
        'text-xs font-semibold leading-none',
        'border border-opacity-30',
        colors.bg,
        colors.text,
        colors.border,
        className,
      ].join(' ')}
    >
      {text}
    </span>
  );
}
