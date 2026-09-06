import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import OrdersPage from './pages/OrdersPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import FinDetailModal from './components/FinDetailModal';
import BookingChatModal from './components/BookingChatModal';

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return 'marketplace';
    if (window.location.pathname === '/owner') return 'owner';
    if (window.location.pathname === '/orders') return 'orders';
    return 'marketplace';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('myfinz_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [selectedFin, setSelectedFin] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [searchBarProps, setSearchBarProps] = useState(null); // State untuk menampung props SearchBar dari Marketplace

  useEffect(() => {
    const syncViewFromPath = () => {
      const pathname = window.location.pathname;
      const nextView = pathname === '/owner' ? 'owner' : pathname === '/orders' ? 'orders' : 'marketplace';
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
          setCurrentUser(null);
          handleBackToMarketplace();
        }}
      />

      {activeView === 'owner' ? (
        <OwnerDashboardPage
          currentUser={currentUser}
          onBackToMarketplace={handleBackToMarketplace}
          setChatBooking={setChatBooking}
        />
      ) : activeView === 'orders' ? (
        <OrdersPage
          currentUser={currentUser}
          onBackToMarketplace={handleBackToMarketplace}
          setChatBooking={setChatBooking}
        />
      ) : (
        <MarketplacePage
          currentUser={currentUser}
          onSelectFin={setSelectedFin}
          setSearchBarProps={setSearchBarProps}
        />
      )}

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