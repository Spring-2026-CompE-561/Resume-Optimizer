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
          "bg-[linear-gradient(135deg,#2f63ff_0%,#2457ff_100%)] text-primary-foreground shadow-[0_18px_40px_rgba(47,99,255,0.24)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        secondary:
          "border border-border bg-white text-foreground shadow-[0_12px_30px_rgba(20,37,84,0.06)] hover:-translate-y-0.5 hover:border-[#d7def4] hover:bg-white",
        ghost: "text-foreground hover:bg-foreground/5",
        soft: "bg-accent text-accent-foreground hover:bg-[#ecf2ff]",
        destructive:
          "border border-[rgba(255,93,84,0.45)] bg-white text-[var(--color-danger)] shadow-[0_12px_30px_rgba(20,37,84,0.05)] hover:bg-[rgba(255,93,84,0.05)]",
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
