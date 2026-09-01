import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ProseProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

/**
 * Long-form text wrapper. All typographic rules live in the `.prose` block in
 * globals.css, driven by tokens, so this component stays style-free.
 */
export function Prose({ children, as: Tag = "div", className }: ProseProps) {
  return <Tag className={cn("prose", className)}>{children}</Tag>;
}
