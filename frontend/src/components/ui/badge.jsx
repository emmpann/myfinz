import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', {
    variants: {
        variant: {
            default: 'border-transparent bg-blue-600 text-white',
            secondary: 'border-transparent bg-slate-100 text-slate-700',
            outline: 'border-slate-200 text-slate-700',
            success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        },
    },
    defaultVariants: { variant: 'default' },
});

export function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
