import { cn } from "./utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center px-6",
        className
      )}
    >
      {icon && (
        <div className="mx-auto mb-5 flex size-14 items-center justify-center border border-[#D4D4D0] bg-white text-[#059669]">
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 text-sm font-bold text-[#111111] tracking-[-0.02em] uppercase">{title}</h3>
      {description && (
        <p className="mb-5 text-xs text-[#888888] max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
