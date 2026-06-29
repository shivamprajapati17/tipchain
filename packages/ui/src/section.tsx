import { cn } from "./utils";

export interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Section({
  title,
  icon,
  children,
  className,
  action,
}: SectionProps) {
  return (
    <div
      className={cn(
        "border border-[#D4D4D0] bg-white",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#D4D4D0] px-5 py-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="flex size-7 items-center justify-center border border-[#D4D4D0] bg-[#F9F9F7] text-[10px] text-[#059669] font-bold">
                //
              </div>
            )}
            <h2 className="text-xs font-bold text-[#111111] tracking-[0.08em] uppercase">{title}</h2>
          </div>
          {action}
        </div>
      )}
      <div className="p-2">{children}</div>
    </div>
  );
}
