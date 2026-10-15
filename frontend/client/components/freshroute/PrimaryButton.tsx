import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "warning";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 hover:shadow-lg active:scale-[0.97] hover:scale-[1.02] transition-all duration-150",
  secondary:
    "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary active:scale-[0.97] hover:scale-[1.02] transition-all duration-150",
  warning:
    "border border-warning/40 bg-warning/10 text-warning hover:border-warning/60 hover:bg-warning/20 active:scale-[0.97] hover:scale-[1.02] transition-all duration-150",
};

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ variant = "primary", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
PrimaryButton.displayName = "PrimaryButton";
