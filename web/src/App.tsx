import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import HomePage from '@/pages/HomePage';
import ReservationsPage from '@/pages/ReservationsPage';
import StaffPage from '@/pages/StaffPage';

const Header: React.FC<{ userEmail?: string; onSignOut: () => void }> = ({
  userEmail,
  onSignOut,
}) => {
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
          {userEmail && (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <span className="text-gray-600">{userEmail}</span>
              <button
                onClick={onSignOut}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const logoutUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN.replace(
      'https://cognito-idp.eu-central-1.amazonaws.com/',
      'https://'
    );
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-red-600">
            Error: {auth.error.message}
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">はい HAI</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access the application
          </p>
          <button
            onClick={() => auth.signinRedirect()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-700">
        <Header
          userEmail={auth.user?.profile.email as string}
          onSignOut={signOutRedirect}
        />
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
