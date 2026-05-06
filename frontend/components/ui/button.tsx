"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-gradient)] text-primary-foreground shadow-[0_18px_40px_var(--primary-shadow)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        secondary:
          "border border-border bg-card text-foreground shadow-[0_12px_30px_var(--soft-shadow)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted",
        ghost: "text-foreground hover:bg-foreground/5",
        soft: "bg-accent text-accent-foreground hover:bg-muted",
        destructive:
          "border border-danger/40 bg-card text-danger shadow-[0_12px_30px_var(--soft-shadow)] hover:bg-danger/10",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-14 px-7 text-base",
        sm: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
