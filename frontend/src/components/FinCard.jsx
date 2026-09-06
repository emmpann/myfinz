import React from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export default function FinCard({ item, onClick }) {
    const isWaitingList = item.availabilityStatus === 'WAITING LIST' || item.status === 'WAITING LIST';

    return (
        <Card
            className="group cursor-pointer rounded-xl p-2 transition hover:-translate-y-0.5 hover:shadow-md sm:p-2.5"
            onClick={onClick}
        >
            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 mb-2 sm:aspect-4/3 sm:mb-3">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105 pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        Tidak Ada Gambar
                    </div>
                )}

                {/* Badge Status dengan Warna Amber untuk WAITING LIST */}
                <Badge
                    className={`absolute left-2 top-2 gap-1 px-2 py-0.5 text-[9px] font-semibold shadow-sm sm:left-3 sm:top-3 sm:text-[10px] ${isWaitingList
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                >
                    <ShieldCheck className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isWaitingList ? 'text-amber-600' : 'text-emerald-600'}`} />
                    {isWaitingList ? 'WAITING LIST' : (item.availabilityStatus || item.status || 'AVAILABLE')}
                </Badge>
            </div>

            {/* Nama Owner / Lender */}
            <div className="mb-0.5 flex items-center gap-1 px-0.5 text-[10px] text-slate-500 sm:px-1 sm:text-xs">
                <UserRound className="h-3 w-3 text-blue-600 shrink-0" />
                <span className="truncate font-medium text-slate-700">
                    {item.ownerName || item.lenderName || 'Pemilik Fins'}
                </span>
            </div>

            <div className="mb-1 flex items-start justify-between px-0.5 sm:px-1">
                <h3 className="line-clamp-1 text-xs font-semibold text-slate-900 transition group-hover:text-blue-600 sm:text-sm">
                    {item.title}
                </h3>
            </div>

            <p className="mb-1 line-clamp-2 px-0.5 text-[10px] text-slate-500 sm:mb-2 sm:px-1 sm:text-xs">
                {item.category} · Size {item.size} · {item.locationCity}
            </p>

            <div className="px-0.5 pb-0.5 text-xs font-bold text-slate-900 sm:px-1 sm:pb-1 sm:text-sm">
                Rp {Number(item.pricePerDay || 0).toLocaleString('id-ID')}
                <span className="text-xs font-normal text-slate-500"> / hari</span>
            </div>
        </Card>
    );
}