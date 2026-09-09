import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import OrdersPage from './pages/OrdersPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import FinDetailModal from './components/FinDetailModal';
import BookingChatModal from './components/BookingChatModal';
import { Button } from './components/ui/button';

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return 'marketplace';
    const pathname = window.location.pathname;
    if (pathname === '/owner') return 'owner';
    if (pathname === '/orders') return 'orders';
    if (pathname === '/reset-password') return 'reset-password';
    if (pathname === '/verify-email') return 'verify-email';
    return 'marketplace';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('myfinz_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [selectedFin, setSelectedFin] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [searchBarProps, setSearchBarProps] = useState(null);

  useEffect(() => {
    const syncViewFromPath = () => {
      const pathname = window.location.pathname;
      let nextView = 'marketplace';

      if (pathname === '/owner') nextView = 'owner';
      else if (pathname === '/orders') nextView = 'orders';
      else if (pathname === '/reset-password') nextView = 'reset-password';
      else if (pathname === '/verify-email') nextView = 'verify-email';

      setActiveView((prev) => (prev !== nextView ? nextView : prev));
    };

    syncViewFromPath();
    window.addEventListener('popstate', syncViewFromPath);
    return () => window.removeEventListener('popstate', syncViewFromPath);
  }, []);

  const handleOpenOrdersPage = () => {
    if (!currentUser) return;
    setSelectedFin(null);
    window.history.pushState({}, '', '/orders');
    setActiveView('orders');
  };

  const handleOpenOwnerDashboard = () => {
    if (!currentUser) return;
    setSelectedFin(null);
    window.history.pushState({}, '', '/owner');
    setActiveView('owner');
  };

  const handleBackToMarketplace = () => {
    setSelectedFin(null);
    window.history.pushState({}, '', '/');
    setActiveView('marketplace');
  };

  if (activeView === 'reset-password') {
    return <ResetPasswordPage onBackToHome={handleBackToMarketplace} />;
  }

  if (activeView === 'verify-email') {
    return <VerifyEmailPage onBackToHome={handleBackToMarketplace} />;
  }

  // Helper Komponen Tampilan Terblokir
  const RenderUnverifiedBlock = () => (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-xl">
          !
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Verifikasi Email Diperlukan</h3>
        <p className="text-xs text-slate-600 mb-6">
          Kamu belum memverifikasi email <strong>{currentUser?.email}</strong>. Silakan cek inbox/spam email kamu dan klik tautan verifikasi untuk mengakses fitur ini.
        </p>
        <Button onClick={handleBackToMarketplace} className="w-full">
          Kembali ke Marketplace
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar
        searchBarProps={searchBarProps}
        onResetFilter={handleBackToMarketplace}
        onOpenBookings={handleOpenOrdersPage}
        onOpenOwnerDashboard={handleOpenOwnerDashboard}
        currentUser={currentUser}
        isOwnerView={activeView === 'owner'}
        isOrdersView={activeView === 'orders'}
        onSignOut={() => {
          localStorage.removeItem('myfinz_user');
          localStorage.removeItem('myfinz_demo_user_id');
          localStorage.removeItem('token');
          setCurrentUser(null);
          handleBackToMarketplace();
        }}
      />

      {/* RENDER DENGAN PROTEKSI ISVERIFIED */}
      {activeView === 'owner' ? (
        !currentUser?.isVerified ? (
          <RenderUnverifiedBlock />
        ) : (
          <OwnerDashboardPage
            currentUser={currentUser}
            onBackToMarketplace={handleBackToMarketplace}
            setChatBooking={setChatBooking}
          />
        )
      ) : activeView === 'orders' ? (
        !currentUser?.isVerified ? (
          <RenderUnverifiedBlock />
        ) : (
          <OrdersPage
            currentUser={currentUser}
            onBackToMarketplace={handleBackToMarketplace}
            setChatBooking={setChatBooking}
          />
        )
      ) : (
        <MarketplacePage
          currentUser={currentUser}
          onSelectFin={setSelectedFin}
          setSearchBarProps={setSearchBarProps}
        />
      )}

      {/* PROTEKSI TOMBOL PENYEWAAN DI MODAL DETAIL FINS */}
      {selectedFin && (
        <FinDetailModal
          item={selectedFin}
          onClose={() => setSelectedFin(null)}
          currentUser={currentUser}
        />
      )}

      {chatBooking && (
        <BookingChatModal
          booking={chatBooking}
          currentUser={currentUser}
          onClose={() => setChatBooking(null)}
        />
      )}
    </div>
  );
}