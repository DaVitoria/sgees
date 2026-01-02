import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveFormGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

// Responsive grid for form fields - stacks on mobile, grid on desktop
export const ResponsiveFormGrid = React.forwardRef<
  HTMLDivElement,
  ResponsiveFormGridProps
>(({ children, className, columns = 2 }, ref) => {
  const colClasses = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 gap-4",
        colClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
});
ResponsiveFormGrid.displayName = "ResponsiveFormGrid";

// Full width field that spans all columns
export const ResponsiveFormFullWidth = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div ref={ref} className={cn("col-span-1 md:col-span-full", className)}>
    {children}
  </div>
));
ResponsiveFormFullWidth.displayName = "ResponsiveFormFullWidth";

// Dialog content wrapper with responsive sizing
export const ResponsiveDialogContent = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto p-1",
      className
    )}
  >
    {children}
  </div>
));
ResponsiveDialogContent.displayName = "ResponsiveDialogContent";

// Responsive button group - stacks on mobile
export const ResponsiveButtonGroup = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
  >
    {children}
  </div>
));
ResponsiveButtonGroup.displayName = "ResponsiveButtonGroup";

// Section header with responsive sizing
export const ResponsiveSectionHeader = React.forwardRef<
  HTMLDivElement,
  { 
    title: string; 
    description?: string; 
    action?: React.ReactNode;
    className?: string 
  }
>(({ title, description, action, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
      className
    )}
  >
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {action && <div className="mt-2 sm:mt-0">{action}</div>}
  </div>
));
ResponsiveSectionHeader.displayName = "ResponsiveSectionHeader";
