import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border text-xs font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/15",
        outline:
          "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20",
        secondary:
          "bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white",
        ghost:
          "border-transparent bg-transparent text-white/50 hover:text-white hover:bg-white/5",
        destructive:
          "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        link: "text-emerald-400 underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-9 px-4 gap-2 rounded-lg",
        xs: "h-6 px-2.5 gap-1 text-[10px] rounded-md",
        sm: "h-7 px-3 gap-1.5 text-[10px] rounded-md",
        lg: "h-11 px-8 gap-2.5 text-sm rounded-xl",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
