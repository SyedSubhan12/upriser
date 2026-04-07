import React from "react";

import { cn } from "@/lib/utils";

interface AnimatedBorderButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    gradientColors?: string[];
    borderWidth?: string;
    duration?: string;
    className?: string;
    children?: React.ReactNode;
}

const AnimatedBorderButton = React.forwardRef<
    HTMLButtonElement,
    AnimatedBorderButtonProps
>(
    (
        {
            gradientColors = ["#ffaa40", "#9c40ff", "#ffaa40"],
            borderWidth = "2px",
            duration = "3s",
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
                    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-background px-6 py-3 font-medium text-foreground",
                    "transform-gpu transition-all duration-300 ease-in-out",
                    "hover:scale-[1.02] active:translate-y-px",
                    className,
                )}
                style={
                    {
                        "--border-width": borderWidth,
                        "--duration": duration,
                        "--gradient-colors": gradientColors.join(", "),
                    } as React.CSSProperties
                }
                {...props}
            >
                {/* Animated gradient border */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                        padding: borderWidth,
                        background: `conic-gradient(from var(--angle), ${gradientColors.join(", ")})`,
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                        WebkitMaskComposite: "xor",
                        animation: `border-rotate ${duration} linear infinite`,
                    }}
                />

                {/* Inner glow on hover */}
                <div className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-background opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <span className="relative z-10">{children}</span>
            </button>
        );
    },
);

AnimatedBorderButton.displayName = "AnimatedBorderButton";

export { AnimatedBorderButton };
