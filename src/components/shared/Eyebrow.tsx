import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: "default" | "lg";
}

/**
 * Editorial eyebrow label — JetBrains Mono uppercase com tracking.
 * Mapeia 1:1 com `.eyebrow` / `.eyebrow-lg` definidos em src/index.css
 * (alinhado com design/assets/pulse.css).
 */
export const Eyebrow = ({
  size = "default",
  className,
  children,
  ...rest
}: EyebrowProps) => (
  <p
    className={cn(size === "lg" ? "eyebrow-lg" : "eyebrow", className)}
    {...rest}
  >
    {children}
  </p>
);
