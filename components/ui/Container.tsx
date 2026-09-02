import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps {
  children: ReactNode;
  /** Render a different element (e.g. "header", "footer"). Defaults to "div". */
  as?: ElementType;
  /** "default" ~ 72rem reading width; "wide" ~ 80rem for full-bleed chrome. */
  width?: "default" | "wide";
  className?: string;
}

const widths: Record<NonNullable<ContainerProps["width"]>, string> = {
  default: "max-w-[72rem]",
  wide: "max-w-[80rem]",
};

/**
 * Horizontal layout frame: centred, capped width, consistent gutters.
 * Extra props (e.g. `aria-label`, `id`) pass through to the rendered element,
 * so chrome landmarks can route their outer width through this primitive.
 */
export function Container({
  children,
  as: Tag = "div",
  width = "default",
  className,
  ...rest
}: ContainerProps & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  return (
    <Tag
      className={cn("mx-auto w-full px-6 sm:px-8", widths[width], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
