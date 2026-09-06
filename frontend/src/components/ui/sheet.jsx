import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef(({ side = 'bottom', className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm" />
        <DialogPrimitive.Content ref={ref} className={cn('fixed z-50 flex flex-col border border-slate-200 bg-white p-5 shadow-2xl outline-none', side === 'bottom' ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl' : 'inset-y-0 right-0 h-full w-[min(100%,28rem)] rounded-l-3xl', className)} {...props}>
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export function SheetHeader({ className, ...props }) {
    return <div className={cn('mb-5 flex flex-col space-y-1.5 text-left', className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
    return <DialogPrimitive.Title className={cn('text-lg font-semibold text-slate-900', className)} {...props} />;
}
