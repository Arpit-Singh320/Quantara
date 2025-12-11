import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        danger: "border-transparent bg-destructive/15 text-destructive",
        ai: "border-transparent bg-accent/15 text-accent",
        source: "border-border bg-secondary/50 text-muted-foreground font-normal gap-1.5 px-2 py-1",
        ghost: "border-transparent bg-transparent text-muted-foreground",
        "risk-high": "border-transparent bg-risk-high/15 text-risk-high font-semibold",
        "risk-medium": "border-transparent bg-risk-medium/15 text-risk-medium font-semibold",
        "risk-low": "border-transparent bg-risk-low/15 text-risk-low font-semibold",
      },
      size: {
        default: "px-2 py-0.5",
        sm: "px-1.5 py-0 text-[10px]",
        lg: "px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
