import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import VoiceSupport from './components/VoiceSupport';
import { UserRole, SessionUser } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const handleLogin = (user: SessionUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUser={currentUser} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route 
              path="/" 
              element={currentUser && currentUser.role === UserRole.CUSTOMER ? <Home currentUser={currentUser} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!currentUser ? <Login onLogin={handleLogin} /> : (currentUser.role === UserRole.ADMIN ? <Navigate to="/admin" /> : <Navigate to="/" />)} 
            />
            <Route 
              path="/register" 
              element={<Register />} 
            />
            <Route 
              path="/admin" 
              element={currentUser && currentUser.role === UserRole.ADMIN ? <Admin /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        
        {/* Voice Assistant is available everywhere */}
        <VoiceSupport />
      </div>
    </Router>
  );
};

export default App;