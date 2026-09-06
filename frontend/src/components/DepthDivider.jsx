import React from 'react';

export default function DepthDivider({ depth, label }) {
    return (
        <div className="flex items-center gap-[18px] max-w-[1240px] mx-auto px-5 sm:px-8 py-10">
            <span className="text-[11.5px] text-mist-dim font-mono tracking-widest whitespace-nowrap">
                — <b className="text-current-bright font-medium">{depth}</b> · {label} —
            </span>
            <div className="flex-1 h-[1px] depth-divider-line" />
        </div>
    );
}