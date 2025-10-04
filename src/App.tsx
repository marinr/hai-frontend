import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';

import HomePage from '@/pages/HomePage';
import ReservationsPage from '@/pages/ReservationsPage';
import StaffPage from '@/pages/StaffPage';

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors hover:text-gray-900 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'}`;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">はい HAI</h2>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/reservations" className={navLinkClass}>
            Reservations
          </NavLink>
          <NavLink to="/staff" className={navLinkClass}>
            Staff
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-700">
        <Header />
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-x-hidden text-sm">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/staff" element={<StaffPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
