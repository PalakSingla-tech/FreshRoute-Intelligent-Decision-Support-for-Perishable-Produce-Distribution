import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        heading: ["'Outfit'", "'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        info: "var(--color-info)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        background: "var(--color-canvas)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-fg)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-fg)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "#FFFFFF",
        },
        border: "var(--color-border)",
        input: "var(--color-secondary)",
        ring: "var(--color-primary)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.625rem",
        sm: "0.5rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "0 0 28px -8px rgba(34, 197, 94, 0.45)",
        "glow-amber": "0 0 28px -8px rgba(234, 179, 8, 0.35)",
        "glow-frost": "0 0 28px -8px rgba(2, 132, 199, 0.35)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
