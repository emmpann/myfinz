import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500', className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm', className)} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn('mt-4 focus:outline-none data-[state=inactive]:hidden', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
