import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}: GlassButtonProps) {
    const baseStyles = "glass-button rounded-full inline-flex items-center justify-center cursor-pointer select-none";

    const variants = {
        primary: "bg-white/40 text-[var(--toss-blue)] border-white/60 hover:bg-white/60",
        secondary: "bg-white/20 text-[var(--toss-grey-700)] border-white/40 hover:bg-white/40",
        danger: "bg-red-500/20 text-red-600 border-red-500/40 hover:bg-red-500/30",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg font-bold",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
