import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import VoiceSupport from './components/VoiceSupport';
import { UserRole } from './types';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(UserRole.GUEST);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar userRole={userRole} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route 
              path="/" 
              element={userRole !== UserRole.GUEST ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={userRole === UserRole.GUEST ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={<Register />} 
            />
            <Route 
              path="/admin" 
              element={userRole === UserRole.ADMIN ? <Admin /> : <Navigate to="/login" />} 
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