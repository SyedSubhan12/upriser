import React from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    pulseColor?: string;
    duration?: string;
    className?: string;
    children?: React.ReactNode;
}

const PulsatingButton = React.forwardRef<
    HTMLButtonElement,
    PulsatingButtonProps
>(
    (
        {
            pulseColor = "hsl(var(--primary))",
            duration = "1.5s",
            className,
            children,
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative flex cursor-pointer items-center justify-center rounded-lg bg-primary px-6 py-3 text-center text-primary-foreground font-medium",
                    "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
                    className,
                )}
                style={
                    {
                        "--pulse-color": pulseColor,
                        "--duration": duration,
                    } as React.CSSProperties
                }
                {...props}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-lg bg-inherit" />
            </button>
        );
    },
);

PulsatingButton.displayName = "PulsatingButton";

export { PulsatingButton };
