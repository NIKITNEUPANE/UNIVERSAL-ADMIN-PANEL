import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all backdrop-blur-md shadow-2xs',
  {
    variants: {
      variant: {
        default: 'border-indigo-200/80 bg-indigo-500/10 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
        secondary: 'border-slate-200/80 bg-slate-500/10 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
        success: 'border-emerald-200/80 bg-emerald-500/10 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
        warning: 'border-amber-200/80 bg-amber-500/10 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
        destructive: 'border-rose-200/80 bg-rose-500/10 text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
        outline: 'text-slate-700 border-white/80 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
