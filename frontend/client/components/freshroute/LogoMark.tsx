import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9 shrink-0", className)}
    >
      <defs>
        <linearGradient id="fr-logo-gradient" x1="4" y1="2" x2="20" y2="23">
          <stop offset="0" stopColor="#4ADE80" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <path
        d="M12 22.5s-7.5-6.6-7.5-12.3a7.5 7.5 0 0 1 15 0c0 5.7-7.5 12.3-7.5 12.3z"
        fill="url(#fr-logo-gradient)"
      />
      <path
        d="M12 5.9c2.4 1.5 3.4 3.6 3.4 5.2 0 1.9-1.5 3.2-3.4 3.2s-3.4-1.3-3.4-3.2c0-1.6 1-3.7 3.4-5.2z"
        fill="#F0FDF4"
      />
      <path
        d="M12 7.9v7.2"
        stroke="#16A34A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
