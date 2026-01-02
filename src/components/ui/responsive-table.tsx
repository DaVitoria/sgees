import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  isHeader?: boolean;
}

// Container that wraps the table with horizontal scroll on mobile
export const ResponsiveTableContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full overflow-auto -mx-4 px-4 md:mx-0 md:px-0",
      className
    )}
  >
    {children}
  </div>
));
ResponsiveTableContainer.displayName = "ResponsiveTableContainer";

// Card-style display for mobile
export const ResponsiveTableCard = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableRowProps
>(({ children, className, onClick }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className={cn(
      "block md:hidden p-4 border rounded-lg bg-card mb-3 space-y-2",
      onClick && "cursor-pointer hover:bg-accent/50 transition-colors",
      className
    )}
  >
    {children}
  </div>
));
ResponsiveTableCard.displayName = "ResponsiveTableCard";

// Card item with label for mobile
export const ResponsiveTableCardItem = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableCellProps
>(({ children, label, className }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-0.5", className)}>
    {label && (
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    )}
    <span className="text-sm">{children}</span>
  </div>
));
ResponsiveTableCardItem.displayName = "ResponsiveTableCardItem";

// Inline card item for horizontal layout
export const ResponsiveTableCardRow = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between gap-2", className)}
  >
    {children}
  </div>
));
ResponsiveTableCardRow.displayName = "ResponsiveTableCardRow";

// Wrapper that shows table on desktop, cards on mobile
interface ResponsiveTableWrapperProps {
  desktopTable: React.ReactNode;
  mobileCards: React.ReactNode;
  className?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  desktopTable,
  mobileCards,
  className,
}) => (
  <div className={cn(className)}>
    <div className="hidden md:block">{desktopTable}</div>
    <div className="block md:hidden">{mobileCards}</div>
  </div>
);
