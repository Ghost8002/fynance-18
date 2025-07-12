
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-finance-primary/10 bg-white px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-finance-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-primary/20 focus-visible:ring-offset-2 focus-visible:border-finance-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-finance-primary/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
