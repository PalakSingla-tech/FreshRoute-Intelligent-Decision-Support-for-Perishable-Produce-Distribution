import { useTheme } from "./ThemeContext";

export function AgriFieldBackdrop() {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60 transition-opacity duration-500"
    >
      {/* Organic radial atmospheric glow */}
      <div
        className="absolute inset-0 bg-[radial-gradient(65%_45%_at_5%_0%,rgba(34,197,94,0.12),transparent_65%),radial-gradient(55%_40%_at_95%_0%,rgba(234,179,8,0.08),transparent_60%),radial-gradient(60%_50%_at_50%_100%,rgba(16,185,129,0.05),transparent_75%)]"
      />

      {/* Stylized Farmland Contour Terraces (Animated SVG) */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[65vh] transition-opacity duration-500"
        style={{
          opacity: isDark ? 0.22 : 0.15,
        }}
      >
        <defs>
          <linearGradient id="terrace-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#EAB308" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="terrace-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16A34A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Animated contour terrace waves */}
        <path
          d="M-50,600 C300,520 600,680 950,560 C1200,480 1350,580 1500,540 L1500,900 L-50,900 Z"
          fill="url(#terrace-grad-1)"
          className="animate-[pulse_8s_ease-in-out_infinite]"
        />

        <path
          d="M-50,680 C250,620 550,750 900,660 C1150,600 1320,700 1500,650 L1500,900 L-50,900 Z"
          fill="url(#terrace-grad-2)"
          className="animate-[pulse_12s_ease-in-out_infinite_reverse]"
        />

        {/* Subtle agricultural crop furrow lines */}
        <g stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" className="text-primary/20">
          <path d="M0,640 Q400,590 800,690 T1440,620" />
          <path d="M0,710 Q450,660 850,760 T1440,690" />
          <path d="M0,780 Q400,740 900,810 T1440,760" />
        </g>
      </svg>
    </div>
  );
}
