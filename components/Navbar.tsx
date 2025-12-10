import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, GraduationCap, LayoutDashboard, WalletCards } from 'lucide-react';
import { UserRole, SessionUser } from '../types';

interface NavbarProps {
  currentUser: SessionUser | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 font-semibold bg-indigo-50 rounded-md' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={currentUser?.role === UserRole.ADMIN ? "/admin" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-none">OkulYönetim</span>
                <span className="text-xs text-gray-500 font-medium">Öğrenci & Finans Sistemi</span>
              </div>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {currentUser?.role === UserRole.CUSTOMER && (
                <Link to="/" className={`inline-flex items-center px-3 py-2 text-sm font-medium ${isActive('/')}`}>
                   <WalletCards className="w-4 h-4 mr-2" />
                   Öğrenci Bilgilerim
                </Link>
              )}
              {currentUser?.role === UserRole.ADMIN && (
                <Link to="/admin" className={`inline-flex items-center px-3 py-2 text-sm font-medium ${isActive('/admin')}`}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Yönetim Paneli
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                 <span className="text-sm text-gray-600 hidden md:flex flex-col items-end border-r border-gray-300 pr-4">
                  <span className="font-bold text-indigo-900">
                    {currentUser.role === UserRole.ADMIN ? 'Sayın Yönetici' : currentUser.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentUser.role === UserRole.ADMIN ? 'Okul Müdürü' : `Veli (${currentUser.studentName})`}
                  </span>
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                  title="Güvenli Çıkış"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-900 hover:bg-indigo-800 shadow-sm transition-all"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;