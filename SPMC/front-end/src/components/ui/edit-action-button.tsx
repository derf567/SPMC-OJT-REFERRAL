import { Edit } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditActionButtonProps extends Omit<ButtonProps, "variant" | "size"> {
  label?: string;
}

export const EditActionButton = ({
  className,
  label = "Edit",
  children,
  ...props
}: EditActionButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 gap-1.5 border-amber-200 bg-amber-50 px-2 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <Edit className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  );
};
