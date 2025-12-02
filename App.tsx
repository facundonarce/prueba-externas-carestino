
import React, { useState, useEffect } from 'react';
import { User, TimeLog, Store, Audit } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuditForm } from './components/AuditForm';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'audit'>('dashboard');
  
  const [userDatabase, setUserDatabase] = useState<Record<string, User & { password: string }>>({});
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersError) {
        console.error('Error fetching users:', usersError.message || usersError);
      }
      
      const userMap: Record<string, User & { password: string }> = {};
      if (usersData) {
        usersData.forEach((u: any) => {
          userMap[u.username] = {
            username: u.username,
            password: u.password,
            fullName: u.full_name,
            role: u.role,
            jobTitle: u.job_title,
            photoUrl: u.photo_url,
            requiredUniform: u.required_uniform,
            assignedStoreIds: u.assigned_store_ids || []
          };
        });
      }
      setUserDatabase(userMap);

      // 2. Fetch Stores
      const { data: storesData, error: storesError } = await supabase.from('stores').select('*');
      if (storesError) {
        console.error('Error fetching stores:', storesError.message || storesError);
      }
      
      if (storesData) {
        setStores(storesData.map((s: any) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          lat: s.lat,
          lng: s.lng
        })));
      }

      // 3. Fetch Time Logs
      const { data: logsData, error: logsError } = await supabase
        .from('time_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (logsError) {
        console.error('Error fetching logs:', logsError.message || logsError);
      }
      
      if (logsData) {
        setTimeLogs(logsData.map((l: any) => ({
          id: l.id,
          userId: l.user_id,
          userFullName: l.user_full_name,
          userPhotoUrl: l.user_photo_url,
          storeId: l.store_id,
          storeName: l.store_name,
          type: l.type,
          timestamp: l.timestamp,
          hasIncident: l.has_incident,
          incidentDetail: l.incident_detail,
          identityScore: l.identity_score,
          uniformCompliant: l.uniform_compliant,
          uniformDetails: l.uniform_details,
          location: (l.location_lat && l.location_lng) ? { lat: l.location_lat, lng: l.location_lng } : undefined,
          distanceToStore: l.distance_to_store,
          locationAllowed: l.location_allowed
        })));
      }

      // 4. Fetch Audits
      const { data: auditsData, error: auditsError } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (auditsError) {
        console.error('Error fetching audits:', auditsError.message || auditsError);
      }
      
      if (auditsData) {
          setAudits(auditsData.map((a: any) => ({
              id: a.id,
              created_at: a.created_at,
              store_id: a.store_id,
              user_id: a.user_id,
              answers: a.answers,
              photos: a.photos,
              ai_report: a.ai_report,
              score: a.score
          })));
      }

    } catch (error) {
      console.error("Critical error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  // --- ACTIONS ---

  const handleCreateUser = async (newUser: User & { password: string }) => {
    const { error } = await supabase.from('users').insert({
      username: newUser.username,
      full_name: newUser.fullName,
      password: newUser.password,
      role: newUser.role,
      job_title: newUser.jobTitle,
      photo_url: newUser.photoUrl,
      required_uniform: newUser.requiredUniform,
      assigned_store_ids: newUser.assignedStoreIds
    });

    if (error) {
      alert("Error creando usuario: " + error.message);
    } else {
      // Optimistic update or refetch
      fetchData();
    }
  };

  const handleUpdateUser = async (updatedUser: User & { password: string }) => {
    const { error } = await supabase.from('users').update({
      full_name: updatedUser.fullName,
      password: updatedUser.password, // In real app, avoid re-sending if not changed/hashed
      role: updatedUser.role,
      job_title: updatedUser.jobTitle,
      photo_url: updatedUser.photoUrl,
      required_uniform: updatedUser.requiredUniform,
      assigned_store_ids: updatedUser.assignedStoreIds
    }).eq('username', updatedUser.username);

    if (error) {
      alert("Error actualizando usuario: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleClockLog = async (log: TimeLog) => {
    const { error } = await supabase.from('time_logs').insert({
      id: log.id,
      user_id: log.userId,
      user_full_name: log.userFullName,
      user_photo_url: log.userPhotoUrl,
      store_id: log.storeId,
      store_name: log.storeName,
      type: log.type,
      timestamp: log.timestamp,
      has_incident: log.hasIncident,
      incident_detail: log.incidentDetail,
      identity_score: log.identityScore,
      uniform_compliant: log.uniformCompliant,
      uniform_details: log.uniformDetails,
      location_lat: log.location?.lat,
      location_lng: log.location?.lng,
      location_allowed: log.locationAllowed,
      distance_to_store: log.distanceToStore
    });

    if (error) {
      console.error("Error saving log:", error);
      alert("Hubo un error guardando la fichada en la nube, pero se procesó localmente.");
    }
    
    // Always update local state for immediate feedback
    setTimeLogs(prev => [log, ...prev]);
  };

  const handleAddStore = async (newStore: Store) => {
    const { error } = await supabase.from('stores').insert({
      id: newStore.id,
      name: newStore.name,
      address: newStore.address,
      lat: newStore.lat,
      lng: newStore.lng
    });

    if (error) {
      alert("Error creando tienda: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleUpdateStore = async (updatedStore: Store) => {
    const { error } = await supabase.from('stores').update({
      name: updatedStore.name,
      address: updatedStore.address,
      lat: updatedStore.lat,
      lng: updatedStore.lng
    }).eq('id', updatedStore.id);

    if (error) {
      alert("Error actualizando tienda: " + error.message);
    } else {
      fetchData();
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-carestino-500" />
        <p className="text-slate-500 font-medium">Conectando con la base de datos...</p>
      </div>
    );
  }

  // If not logged in, show login
  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} 
        userDatabase={userDatabase}
        onClockLog={handleClockLog}
        stores={stores}
        timeLogs={timeLogs} 
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
        audits={audits}
      />
    );
  }

  // Auditor View - Audit Form
  if (view === 'audit') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <AuditForm 
          onCancel={() => {
              setView('dashboard');
              fetchData(); // Refresh audits on exit
          }} 
          stores={stores}
          user={user}
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
