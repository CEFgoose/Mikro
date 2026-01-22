import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          style={{
            height: 42,
            padding: "10px 14px",
            fontSize: 15,
            ...style,
          }}
          ref={ref}
          {...props}
        />
        {error && (
          <p style={{ marginTop: 4, fontSize: 14, color: "#dc2626" }}>{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
