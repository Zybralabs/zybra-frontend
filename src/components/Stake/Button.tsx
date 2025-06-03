"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import ZybraLogoLoader from "@/components/ZybraLogoLoader"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default: "bg-[#4BB6EE] text-slate-50 hover:bg-[#4BB6EE]/90 dark:bg-[#4BB6EE] dark:text-[#022333] dark:hover:bg-[#4BB6EE]",
        destructive:
          "bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 hover:text-[#022333] dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary:
          "bg-slate-100 text-[#022333] hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        ghost: "hover:bg-slate-100 hover:text-[#022333] dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-[#022333] underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button as React.ElementType;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative overflow-hidden transition-all duration-300",
          loading && "cursor-not-allowed opacity-70"
        )}
        ref={ref}
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ZybraLogoLoader size="sm" />
          </motion.div>
        )}
        <span className={cn("flex items-center justify-center", loading && "opacity-0")}>
          {props.children}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

