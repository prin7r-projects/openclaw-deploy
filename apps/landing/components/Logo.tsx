import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OpenClaw Deploy"
      className={cn('h-8 w-8', className)}
    >
      <rect x="0" y="0" width="64" height="64" fill="#0B0E12" rx="10" />
      <path
        d="M18 14 H10 V50 H18"
        fill="none"
        stroke="#7CFFA1"
        strokeWidth="3"
        strokeLinecap="square"
      />
      <path
        d="M46 14 H54 V50 H46"
        fill="none"
        stroke="#7CFFA1"
        strokeWidth="3"
        strokeLinecap="square"
      />
      <rect x="22" y="22" width="20" height="3" fill="#E6ECF2" />
      <rect x="22" y="30.5" width="20" height="3" fill="#E6ECF2" />
      <rect x="22" y="39" width="20" height="3" fill="#7CFFA1" />
    </svg>
  );
}
