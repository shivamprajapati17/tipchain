import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent text-xs font-bold whitespace-nowrap tracking-[0.1em] uppercase outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-[#059669] text-white border-[#059669] hover:bg-[#047857]",
        outline:
          "border-[#D4D4D0] bg-white text-[#111111] hover:bg-[#F0F0EC]",
        secondary:
          "bg-[#F0F0EC] text-[#111111] border-[#D4D4D0] hover:bg-[#E8E8E4]",
        ghost:
          "border-transparent bg-transparent text-[#888888] hover:text-[#111111] hover:bg-[#F0F0EC]",
        destructive:
          "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/20",
        link: "text-[#059669] underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-9 px-4 gap-2",
        xs: "h-6 px-2.5 gap-1 text-[10px]",
        sm: "h-7 px-3 gap-1.5 text-[10px]",
        lg: "h-11 px-8 gap-2.5 text-xs",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-11",
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
