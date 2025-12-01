
import React, { useState } from 'react';
import { User, USERS, TimeLog, MOCK_TIME_LOGS, STORES, Store } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuditForm } from './components/AuditForm';
import { AdminDashboard } from './components/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'audit'>('dashboard');
  
  // Dynamic State for Users, Logs, and Stores
  const [userDatabase, setUserDatabase] = useState(USERS);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(MOCK_TIME_LOGS);
  const [stores, setStores] = useState<Store[]>(STORES);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleCreateUser = (newUser: User & { password: string }) => {
    setUserDatabase(prev => ({
      ...prev,
      [newUser.username]: newUser
    }));
  };

  const handleUpdateUser = (updatedUser: User & { password: string }) => {
    setUserDatabase(prev => ({
      ...prev,
      [updatedUser.username]: updatedUser
    }));
  };

  const handleClockLog = (log: TimeLog) => {
    setTimeLogs(prev => [log, ...prev]);
  };

  const handleAddStore = (newStore: Store) => {
    setStores(prev => [...prev, newStore]);
  };

  const handleUpdateStore = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
  };

  // If not logged in, show login
  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} 
        userDatabase={userDatabase}
        onClockLog={handleClockLog}
        stores={stores}
        timeLogs={timeLogs} // Pass logs history for validation
      />
    );
  }

  // Admin View
  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        onLogout={handleLogout} 
        userDatabase={userDatabase}
        onAddUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        logs={timeLogs} 
        stores={stores}
        onAddStore={handleAddStore}
        onUpdateStore={handleUpdateStore}
      />
    );
  }

  // Auditor View - Audit Form
  if (view === 'audit') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <AuditForm 
          onCancel={() => setView('dashboard')} 
          stores={stores}
        />
      </div>
    );
  }

  // Auditor View - Dashboard
  return (
    <Dashboard 
      user={user} 
      onStartAudit={() => setView('audit')} 
      onLogout={handleLogout}
    />
  );
};

export default App;
