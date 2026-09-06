import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';

export default function CategoryFilter({ categories, activeCategory, setActiveCategory, activeModal, setActiveModal }) {
    return (
        <div className="sticky top-20 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-2">
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            size="sm"
                            variant={activeCategory === cat ? 'default' : 'secondary'}
                            onClick={() => setActiveCategory(cat)}
                            className="rounded-full px-4 whitespace-nowrap"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setActiveModal?.(activeModal === 'location' ? null : 'location')}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filter
                </Button>
            </div>
        </div>
    );
}