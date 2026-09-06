import React, { useState, useEffect } from 'react';

export default function DepthGauge() {
    const [scrollPct, setScrollPct] = useState(0);
    const maxDepth = 40;

    useEffect(() => {
        const handleScroll = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const pct = Math.min(1, Math.max(0, window.scrollY / scrollable));
            setScrollPct(pct);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const ticks = [];
    for (let m = 0; m <= maxDepth; m += 2) {
        const isMajor = m % 10 === 0;
        ticks.push(
            <React.Fragment key={m}>
                <div
                    className={`absolute left-[-3px] h-[1px] ${isMajor ? 'w-[11px] left-[-5px] bg-mist' : 'w-[7px] bg-mist-dim'
                        }`}
                    style={{ top: `${(m / maxDepth) * 100}%` }}
                />
                {isMajor && (
                    <span
                        className="absolute left-[16px] -translate-y-1/2 text-[10px] text-mist-dim font-mono"
                        style={{ top: `${(m / maxDepth) * 100}%` }}
                    >
                        {m}m
                    </span>
                )}
            </React.Fragment>
        );
    }

    return (
        <div className="fixed left-[28px] top-1/2 -translate-y-1/2 w-[64px] h-[340px] z-40 hidden xl:flex flex-col items-center pointer-events-none">
            <div className="relative w-[1px] h-full bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.09)] to-transparent">
                {ticks}
                {/* Moving Marker */}
                <div
                    className="absolute left-[-14px] w-[29px] h-[29px] rounded-full bg-current flex items-center justify-center shadow-[0_0_0_4px_#0A131B,0_0_18px_rgba(44,134,176,0.7)] transition-all duration-75"
                    style={{ top: `${scrollPct * 100}%` }}
                >
                    <div className="w-[7px] h-[7px] rounded-full bg-foam" />
                </div>
            </div>
            <div className="mt-[14px] text-[11px] text-current-bright font-mono tracking-wider">
                {Math.round(scrollPct * maxDepth)}M
            </div>
        </div>
    );
}