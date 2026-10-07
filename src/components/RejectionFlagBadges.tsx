import type { RejectionFlag } from '../services/api';

const FLAG_LABELS: Record<RejectionFlag, string> = {
  high_rate: 'High decline rate',
  spike_near_limit: 'Decline spike near limit',
};

export function RejectionFlagBadges({ flags }: { flags: RejectionFlag[] }) {
  if (flags.length === 0) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((f) => (
        <span key={f} className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {FLAG_LABELS[f]}
        </span>
      ))}
    </div>
  );
}
