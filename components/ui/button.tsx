import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'liquid-button-primary text-white',
        liquid: 'liquid-button-primary text-white',
        glass: 'liquid-button-glass text-slate-800',
        secondary: 'liquid-button-glass text-slate-800',
        outline: 'border border-white/80 bg-white/70 backdrop-blur-md hover:bg-white text-slate-700 shadow-2xs',
        ghost: 'hover:bg-white/60 hover:backdrop-blur-md text-slate-600 hover:text-slate-900',
        destructive: 'bg-rose-500/10 text-rose-700 border border-rose-200/80 backdrop-blur-md hover:bg-rose-500/20 shadow-2xs',
        success: 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/80 backdrop-blur-md hover:bg-emerald-500/20 shadow-2xs',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8.5 rounded-xl px-3 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-base font-semibold',
        icon: 'h-10 w-10 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
