import React from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function GlassInput({ className, ...props }: GlassInputProps) {
    return (
        <input
            className={cn('glass-input w-full', className)}
            {...props}
        />
    );
}
