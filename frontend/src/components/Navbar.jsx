import React, { useState, useEffect } from 'react';
import { Waves, User, LogOut, Menu } from 'lucide-react';
import SearchBar from './SearchBar';
import AuthModal from './AuthModal';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

export default function Navbar({
    searchBarProps,
    onResetFilter,
    onOpenBookings,
    onOpenOwnerDashboard,
    currentUser,
    isOwnerView = false,
    isOrdersView = false,
    onSignOut,
}) {
    const [authOpen, setAuthOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleOpenAuth = () => setAuthOpen(true);
        window.addEventListener('open-auth-modal', handleOpenAuth);

        return () => {
            window.removeEventListener('open-auth-modal', handleOpenAuth);
        };
    }, []);

    const handleOwnerButtonClick = () => {
        if (!currentUser) {
            setAuthOpen(true);
            return;
        }

        onOpenOwnerDashboard?.();
    };

    const openOrdersFromMobile = () => {
        setMobileMenuOpen(false);
        onOpenBookings?.();
    };

    const openOwnerFromMobile = () => {
        setMobileMenuOpen(false);
        handleOwnerButtonClick();
    };

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0">
                    <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={onResetFilter}>

                        <img
                            src="/logo.png"
                            alt="MyFins"
                            className="w-9 h-9 object-contain"
                        />
                        <span className="font-display font-bold text-xl tracking-wide text-slate-900">MYFINZ</span>
                    </div>

                    {!isOwnerView && !isOrdersView && (
                        <div className="order-3 w-full lg:order-0 lg:w-auto">
                            <SearchBar {...searchBarProps} />
                        </div>
                    )}

                    <div className="flex items-center gap-3 shrink-0">
                        {!isOwnerView && !isOrdersView && currentUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onOpenBookings}
                                className="hidden md:inline-flex"
                            >
                                Pesanan Saya
                            </Button>
                        )}
                        {!isOwnerView && !isOrdersView && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOwnerButtonClick}
                                className="hidden md:inline-flex"
                            >
                                Sewakan Fins Kamu
                            </Button>
                        )}
                        {currentUser ? (
                            <div className="flex items-center gap-2">
                                <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-800">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span>{currentUser.fullName?.split(' ')[0] || 'User'}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onSignOut}
                                    className="hidden rounded-full md:inline-flex"
                                >
                                    <LogOut className="w-4 h-4 text-blue-600" />
                                    <span>Keluar</span>
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setAuthOpen(true)}
                                className="hidden rounded-full md:inline-flex"
                            >
                                <User className="w-4 h-4 text-white" />
                                <span>Masuk</span>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl md:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Buka menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" className="w-[min(86vw,22rem)] p-5">
                    <SheetHeader>
                        <SheetTitle>Menu MYFINZ</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-2">
                        {currentUser && !isOrdersView && (
                            <Button variant="ghost" className="w-full justify-start" onClick={openOrdersFromMobile}>
                                <span className="flex items-center gap-3"><User className="h-4 w-4 text-blue-600" />Pesanan Saya</span>
                            </Button>
                        )}
                        {!isOwnerView && (
                            <Button variant="ghost" className="w-full justify-start" onClick={openOwnerFromMobile}>
                                <span className="flex items-center gap-3"><Waves className="h-4 w-4 text-blue-600" />Sewakan Fins Kamu</span>
                            </Button>
                        )}
                        {currentUser ? (
                            <>
                                <div className="my-3 border-t border-slate-200" />
                                <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span>{currentUser.fullName || 'User'}</span>
                                </div>
                                <Button variant="outline" className="mt-2 w-full justify-start" onClick={() => { setMobileMenuOpen(false); onSignOut?.(); }}>
                                    <LogOut className="h-4 w-4 text-blue-600" />Keluar
                                </Button>
                            </>
                        ) : (
                            <Button className="w-full" onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}>
                                <User className="h-4 w-4" />Masuk
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {authOpen && (
                <AuthModal
                    onClose={() => setAuthOpen(false)}
                    onSuccess={(user) => {
                        localStorage.setItem('myfinz_user', JSON.stringify(user));
                        setAuthOpen(false);
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}