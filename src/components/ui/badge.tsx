
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-finance-primary text-white hover:bg-finance-primary/90 shadow-lg hover:shadow-xl hover:scale-105",
        secondary:
          "border-transparent bg-finance-background-secondary text-finance-text-primary hover:bg-finance-background-alt",
        destructive:
          "border-transparent bg-finance-red text-white hover:bg-finance-red-dark",
        outline: 
          "border-finance-primary text-finance-primary hover:bg-finance-primary hover:text-white",
        success:
          "border-transparent bg-finance-green text-white hover:bg-green-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
