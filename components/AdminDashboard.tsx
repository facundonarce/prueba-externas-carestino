
import React, { useState, useRef } from 'react';
import { User, TimeLog, Store, Audit } from '../types';
import { LogOut, Users, Clock, Search, Shield, Plus, Upload, X, AlertTriangle, ShieldAlert, Shirt, CheckCircle, Store as StoreIcon, Pencil, MapPin, Eye, ExternalLink, Calendar, FileText, ChevronRight } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  userDatabase: Record<string, User & { password: string }>;
  onAddUser: (user: User & { password: string }) => void;
  onUpdateUser: (user: User & { password: string }) => void;
  logs: TimeLog[];
  stores: Store[];
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  audits: Audit[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, onLogout, userDatabase, onAddUser, onUpdateUser, logs, 
  stores, onAddStore, onUpdateStore, audits
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'stores' | 'audits'>('logs');
  
  // -- LOG DETAIL MODAL STATE --
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  
  // -- AUDIT DETAIL MODAL STATE --
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // -- USER MODAL STATE --
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userData, setUserData] = useState<Partial<User & { password: string }>>({
    role: 'auditor',
    photoUrl: '',
    requiredUniform: 'Buzo o campera negra',
    assignedStoreIds: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- STORE MODAL STATE --
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [storeData, setStoreData] = useState<Partial<Store>>({
    name: '',
    address: '',
    lat: -34.603722, // Default BA
    lng: -58.381592
  });

  // --- TIMEZONE HELPER ---
  const formatDateTimeBA = (isoString: string) => {
    try {
      if (!isoString) return { time: '--:--', day: '--/--/--' };
      const date = new Date(isoString);
      
      // Ensure we are converting to Buenos Aires time
      const time = date.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'America/Buenos_Aires' 
      });
      
      const day = date.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit', 
        timeZone: 'America/Buenos_Aires' 
      });
      
      return { time, day };
    } catch (e) {
      console.error("Date parsing error:", e);
      return { time: 'Error', day: 'Fecha' };
    }
  };

  // --- USER HANDLERS ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleStoreAssignment = (storeId: string) => {
    setUserData(prev => {
      const currentIds = prev.assignedStoreIds || [];
      if (currentIds.includes(storeId)) {
        return { ...prev, assignedStoreIds: currentIds.filter(id => id !== storeId) };
      } else {
        return { ...prev, assignedStoreIds: [...currentIds, storeId] };
      }
    });
  };

  const handleOpenCreateUserModal = () => {
    setIsEditingUser(false);
    setUserData({
      role: 'auditor',
      photoUrl: '',
      requiredUniform: 'Buzo o campera negra',
      assignedStoreIds: []
    });
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (userToEdit: User & { password: string }) => {
    setIsEditingUser(true);
    setUserData({ ...userToEdit });
    setShowUserModal(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.username && userData.password && userData.fullName && userData.photoUrl) {
      if (!userData.assignedStoreIds || userData.assignedStoreIds.length === 0) {
        alert("Debe asignar al menos una sucursal al empleado.");
        return;
      }

      if (isEditingUser) {
        onUpdateUser(userData as User & { password: string });
      } else {
        if (userDatabase[userData.username]) {
           alert("El nombre de usuario ya existe.");
           return;
        }
        onAddUser(userData as User & { password: string });
      }

      setShowUserModal(false);
      setUserData({ role: 'auditor', photoUrl: '', requiredUniform: 'Buzo o campera negra', assignedStoreIds: [] });
    } else {
      alert("Por favor complete todos los campos incluyendo la foto.");
    }
  };

  // --- STORE HANDLERS ---
  const handleOpenCreateStoreModal = () => {
    setIsEditingStore(false);
    setStoreData({
        name: '',
        address: '',
        lat: -34.603722,
        lng: -58.381592
    });
    setShowStoreModal(true);
  };

  const handleOpenEditStoreModal = (store: Store) => {
    setIsEditingStore(true);
    setStoreData({ ...store });
    setShowStoreModal(true);
  };

  const handleStoreFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (storeData.name && storeData.address && storeData.lat && storeData.lng) {
          if (isEditingStore) {
              onUpdateStore(storeData as Store);
          } else {
              // Generate ID
              const newStore: Store = {
                  id: `STORE-${Date.now()}`,
                  name: storeData.name,
                  address: storeData.address,
                  lat: Number(storeData.lat),
                  lng: Number(storeData.lng)
              };
              onAddStore(newStore);
          }
          setShowStoreModal(false);
      } else {
          alert("Por favor complete todos los campos de la sucursal.");
      }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header with Safe Area */}
      <header className="bg-slate-900 text-white sticky top-0 z-20 shadow-md pt-safe">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-carestino-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Carestino Admin</h1>
              <p className="text-xs text-slate-400">Panel de Control</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{user.fullName}</p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-safe">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'logs' 
                ? 'bg-carestino-500 text-white shadow-lg shadow-carestino-200' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-5 h-5" />
            Fichadas
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'audits' 
                ? 'bg-carestino-500 text-white shadow-lg shadow-carestino-200' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            Auditorías
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'users' 
                ? 'bg-carestino-500 text-white shadow-lg shadow-carestino-200' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'stores' 
                ? 'bg-carestino-500 text-white shadow-lg shadow-carestino-200' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <StoreIcon className="w-5 h-5" />
            Sucursales
          </button>
        </div>

        {/* Content - Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Registro de Ingresos y Egresos</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-carestino-500 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Empleado</th>
                    <th className="px-6 py-4 font-semibold">Sucursal</th>
                    <th className="px-6 py-4 font-semibold">Tipo</th>
                    <th className="px-6 py-4 font-semibold">Hora (ARG)</th>
                    <th className="px-6 py-4 font-semibold">Eficiencia ID</th>
                    <th className="px-6 py-4 font-semibold">Uniforme</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const { time, day } = formatDateTimeBA(log.timestamp);
                    return (
                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${log.hasIncident ? 'bg-red-50' : !log.uniformCompliant ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                             {log.userPhotoUrl ? (
                               <img src={log.userPhotoUrl} className="w-full h-full object-cover" alt="Selfie" />
                             ) : (
                               log.userFullName.charAt(0)
                             )}
                           </div>
                          <div>
                            <p className="font-bold text-slate-700">{log.userFullName}</p>
                            <p className="text-xs text-slate-400">ID: {log.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5">
                            <StoreIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">{log.storeName || 'N/A'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          log.type === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${log.type === 'INGRESO' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium text-sm">
                        {time}
                        <div className="text-xs text-slate-400">{day}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-full max-w-[80px] h-2 bg-slate-200 rounded-full overflow-hidden">
                             <div 
                               className={`h-full ${log.identityScore >= 80 ? 'bg-green-500' : log.identityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                               style={{ width: `${log.identityScore}%` }}
                             ></div>
                           </div>
                           <span className="text-xs font-bold text-slate-600">{log.identityScore}%</span>
                        </div>
                        {log.hasIncident && <span className="text-xs text-red-500 font-medium block mt-1">Identidad dudosa</span>}
                      </td>
                      <td className="px-6 py-4">
                        {log.uniformCompliant ? (
                          <div className="flex items-center gap-1 text-green-600" title={log.uniformDetails}>
                             <CheckCircle className="w-4 h-4" />
                             <span className="text-xs font-bold">OK</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600" title={log.uniformDetails}>
                             <Shirt className="w-4 h-4" />
                             <span className="text-xs font-bold">Incorrecto</span>
                          </div>
                        )}
                        {!log.uniformCompliant && (
                          <span className="text-xs text-slate-400 block max-w-[150px] truncate">{log.uniformDetails}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="p-2 bg-slate-100 hover:bg-carestino-50 text-slate-500 hover:text-carestino-600 rounded-full transition-colors"
                          title="Ver Detalle y Fotos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content - Audits */}
        {activeTab === 'audits' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Historial de Auditorías</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar sucursal..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-carestino-500 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                   <tr>
                    <th className="px-6 py-4 font-semibold">Fecha (ARG)</th>
                    <th className="px-6 py-4 font-semibold">Sucursal</th>
                    <th className="px-6 py-4 font-semibold">Auditor</th>
                    <th className="px-6 py-4 font-semibold">Puntaje</th>
                    <th className="px-6 py-4 font-semibold">Problemas Críticos</th>
                    <th className="px-6 py-4 font-semibold text-right">Detalle</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {audits.map((audit) => {
                     const store = stores.find(s => s.id === audit.store_id);
                     const auditor = userDatabase[audit.user_id];
                     const { time, day } = formatDateTimeBA(audit.created_at);
                     
                     return (
                       <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">
                             {day}
                             <div className="text-xs text-slate-400">{time}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                             {store ? store.name : audit.store_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                             {auditor ? auditor.fullName : audit.user_id}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                               audit.score >= 90 ? 'bg-green-100 text-green-700' :
                               audit.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                               'bg-red-100 text-red-700'
                             }`}>
                               {audit.score}/100
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             {audit.ai_report.criticalIssues.length > 0 ? (
                               <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                                 <AlertTriangle className="w-3 h-3" />
                                 {audit.ai_report.criticalIssues.length} Detectados
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                 <CheckCircle className="w-3 h-3" />
                                 Sin problemas
                               </span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedAudit(audit)}
                              className="p-2 bg-slate-100 hover:bg-carestino-50 text-slate-500 hover:text-carestino-600 rounded-full transition-colors"
                              title="Ver Reporte Completo"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content - Users */}
        {activeTab === 'users' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Gestión de Usuarios</h2>
              <button 
                onClick={handleOpenCreateUserModal}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Nuevo Usuario
              </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                     <tr>
                        <th className="px-6 py-4 font-semibold">Usuario</th>
                        <th className="px-6 py-4 font-semibold">Rol / Cargo</th>
                        <th className="px-6 py-4 font-semibold">Sucursales Asignadas</th>
                        <th className="px-6 py-4 font-semibold text-right">Editar</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {Object.values(userDatabase).map((u) => (
                       <tr key={u.username} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                  {u.photoUrl ? (
                                    <img src={u.photoUrl} className="w-full h-full object-cover" alt="User" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{u.username.charAt(0).toUpperCase()}</div>
                                  )}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-700">{u.fullName}</p>
                                   <p className="text-xs text-slate-400">@{u.username}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-sm font-medium text-slate-700">{u.jobTitle}</div>
                             <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{u.role}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-wrap gap-1">
                                {u.assignedStoreIds && u.assignedStoreIds.length > 0 ? (
                                   u.assignedStoreIds.map(sid => {
                                     const st = stores.find(s => s.id === sid);
                                     return (
                                       <span key={sid} className="px-2 py-0.5 bg-carestino-50 text-carestino-700 text-xs rounded border border-carestino-100">
                                          {st ? st.name : sid}
                                       </span>
                                     );
                                   })
                                ) : (
                                   <span className="text-xs text-red-400 italic">Sin asignar</span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleOpenEditUserModal(u)}
                               className="p-2 text-slate-400 hover:text-carestino-500 hover:bg-slate-100 rounded-lg transition-colors"
                             >
                               <Pencil className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
           </div>
        )}

        {/* Content - Stores */}
        {activeTab === 'stores' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Red de Sucursales</h2>
              <button 
                onClick={handleOpenCreateStoreModal}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Nueva Sucursal
              </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                     <tr>
                        <th className="px-6 py-4 font-semibold">ID</th>
                        <th className="px-6 py-4 font-semibold">Nombre</th>
                        <th className="px-6 py-4 font-semibold">Dirección</th>
                        <th className="px-6 py-4 font-semibold">Coordenadas</th>
                        <th className="px-6 py-4 font-semibold text-right">Editar</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {stores.map((s) => (
                       <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{s.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{s.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                             <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-carestino-400" />
                                {s.address}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                             {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleOpenEditStoreModal(s)}
                               className="p-2 text-slate-400 hover:text-carestino-500 hover:bg-slate-100 rounded-lg transition-colors"
                             >
                               <Pencil className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
           </div>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Detalle de Fichada</h3>
                  <p className="text-sm text-slate-500">ID: {selectedLog.id}</p>
               </div>
               <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-full">
                 <X className="w-5 h-5 text-slate-500" />
               </button>
             </div>
             <div className="p-6 space-y-6">
                <div className="flex gap-6">
                   <div className="w-32 h-32 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                      {selectedLog.userPhotoUrl ? (
                        <img src={selectedLog.userPhotoUrl} alt="Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin Foto</div>
                      )}
                   </div>
                   <div className="flex-grow space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-xs text-slate-400 uppercase font-bold">Empleado</span>
                            <p className="font-bold text-slate-800">{selectedLog.userFullName}</p>
                         </div>
                         <div>
                            <span className="text-xs text-slate-400 uppercase font-bold">Sucursal</span>
                            <p className="font-medium text-slate-700">{selectedLog.storeName}</p>
                         </div>
                         <div>
                            <span className="text-xs text-slate-400 uppercase font-bold">Tipo</span>
                            <p className={`font-bold ${selectedLog.type === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                               {selectedLog.type}
                            </p>
                         </div>
                         <div>
                            <span className="text-xs text-slate-400 uppercase font-bold">Horario</span>
                            <p className="font-medium text-slate-700">
                               {new Date(selectedLog.timestamp).toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}
                            </p>
                         </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500">Confianza de Identidad</span>
                            <span className="text-xs font-bold text-slate-700">{selectedLog.identityScore}%</span>
                         </div>
                         <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                             <div className={`h-full ${selectedLog.identityScore >= 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${selectedLog.identityScore}%` }}></div>
                         </div>
                      </div>
                   </div>
                </div>

                {selectedLog.hasIncident && (
                   <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <h4 className="flex items-center gap-2 text-red-700 font-bold mb-2">
                         <AlertTriangle className="w-5 h-5" />
                         Incidencia Reportada
                      </h4>
                      <p className="text-red-600 text-sm">{selectedLog.incidentDetail}</p>
                   </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <h4 className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                      <Shirt className="w-5 h-5 text-carestino-500" />
                      Análisis de Uniforme
                   </h4>
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${selectedLog.uniformCompliant ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                         {selectedLog.uniformCompliant ? 'CUMPLE' : 'NO CUMPLE'}
                      </span>
                   </div>
                   <p className="text-slate-600 text-sm">{selectedLog.uniformDetails}</p>
                </div>
                
                {selectedLog.userPhotoUrl && (
                  <a 
                    href={selectedLog.userPhotoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Ver Foto Original
                  </a>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Reporte de Auditoría</h3>
                  <p className="text-sm text-slate-500">
                     {new Date(selectedAudit.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Buenos_Aires' })} • {selectedAudit.store_id}
                  </p>
               </div>
               <button onClick={() => setSelectedAudit(null)} className="p-2 hover:bg-slate-100 rounded-full">
                 <X className="w-5 h-5 text-slate-500" />
               </button>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: AI Report */}
                <div className="space-y-6">
                   <div className={`p-6 rounded-2xl border-2 text-center ${
                      selectedAudit.score >= 90 ? 'bg-green-50 border-green-200 text-green-800' : 
                      selectedAudit.score >= 70 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
                      'bg-red-50 border-red-200 text-red-800'
                   }`}>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-70">Puntaje General</span>
                      <div className="text-5xl font-black my-2">{selectedAudit.score}/100</div>
                      <p className="text-sm font-medium">{selectedAudit.ai_report.summary}</p>
                   </div>

                   {selectedAudit.ai_report.criticalIssues.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                         <h4 className="flex items-center gap-2 font-bold text-red-700 mb-3">
                            <ShieldAlert className="w-5 h-5" /> Problemas Críticos
                         </h4>
                         <ul className="space-y-2">
                            {selectedAudit.ai_report.criticalIssues.map((issue, i) => (
                               <li key={i} className="flex gap-2 text-red-600 text-sm">
                                  <span className="font-bold">•</span> {issue}
                               </li>
                            ))}
                         </ul>
                      </div>
                   )}

                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3">
                         <CheckCircle className="w-5 h-5 text-carestino-500" /> Recomendaciones
                      </h4>
                      <ul className="space-y-2">
                         {selectedAudit.ai_report.recommendations.map((rec, i) => (
                            <li key={i} className="text-slate-600 text-sm flex gap-2">
                               <span className="text-carestino-500">→</span> {rec}
                            </li>
                         ))}
                      </ul>
                   </div>
                </div>

                {/* Right Column: Evidence */}
                <div className="space-y-6">
                   <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Evidencia Fotográfica y Respuestas</h4>
                   <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {Object.entries(selectedAudit.answers).map(([qId, answer]) => (
                         <div key={qId} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">{qId}</p>
                            <p className="font-medium text-slate-800 mb-3">"{answer}"</p>
                            {selectedAudit.photos && selectedAudit.photos[qId] && (
                               <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                                  <img src={selectedAudit.photos[qId]} alt="Evidence" className="w-full h-auto object-cover" />
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* User Edit/Create Modal */}
      {showUserModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">{isEditingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                 <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-500" />
                 </button>
              </div>
              <form onSubmit={handleUserFormSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Usuario (ID)</label>
                       <input 
                         type="text" 
                         value={userData.username} 
                         onChange={e => setUserData({...userData, username: e.target.value})}
                         disabled={isEditingUser}
                         className="w-full p-2 border rounded-lg bg-slate-50"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña</label>
                       <input 
                         type="text" 
                         value={userData.password} 
                         onChange={e => setUserData({...userData, password: e.target.value})}
                         className="w-full p-2 border rounded-lg"
                         required
                       />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={userData.fullName} 
                      onChange={e => setUserData({...userData, fullName: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Rol</label>
                       <select 
                         value={userData.role} 
                         onChange={e => setUserData({...userData, role: e.target.value as any})}
                         className="w-full p-2 border rounded-lg bg-white"
                       >
                          <option value="auditor">Auditor</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Cargo</label>
                       <input 
                         type="text" 
                         value={userData.jobTitle} 
                         onChange={e => setUserData({...userData, jobTitle: e.target.value})}
                         className="w-full p-2 border rounded-lg"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Foto de Referencia (Biometría)</label>
                    <div className="flex gap-4 items-center">
                       {userData.photoUrl && (
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                             <img src={userData.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                       )}
                       <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-carestino-50 file:text-carestino-700 hover:file:bg-carestino-100"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Sucursales Asignadas</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                       {stores.map(store => (
                          <button
                             type="button"
                             key={store.id}
                             onClick={() => toggleStoreAssignment(store.id)}
                             className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                userData.assignedStoreIds?.includes(store.id)
                                  ? 'bg-carestino-500 text-white border-carestino-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-carestino-300'
                             }`}
                          >
                             {store.name}
                          </button>
                       ))}
                    </div>
                 </div>

                 <button type="submit" className="w-full py-3 bg-carestino-500 text-white font-bold rounded-xl hover:bg-carestino-600 transition-colors">
                    {isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                 </button>
              </form>
           </div>
         </div>
      )}

      {/* Store Edit/Create Modal */}
      {showStoreModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">{isEditingStore ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
                 <button onClick={() => setShowStoreModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-500" />
                 </button>
              </div>
              <form onSubmit={handleStoreFormSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                    <input 
                      type="text" 
                      value={storeData.name} 
                      onChange={e => setStoreData({...storeData, name: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Ej. Sucursal Centro"
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dirección</label>
                    <input 
                      type="text" 
                      value={storeData.address} 
                      onChange={e => setStoreData({...storeData, address: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Calle 123, Ciudad"
                      required
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Latitud</label>
                       <input 
                         type="number" 
                         step="any"
                         value={storeData.lat} 
                         onChange={e => setStoreData({...storeData, lat: parseFloat(e.target.value)})}
                         className="w-full p-2 border rounded-lg"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Longitud</label>
                       <input 
                         type="number" 
                         step="any"
                         value={storeData.lng} 
                         onChange={e => setStoreData({...storeData, lng: parseFloat(e.target.value)})}
                         className="w-full p-2 border rounded-lg"
                         required
                       />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-3 bg-carestino-500 text-white font-bold rounded-xl hover:bg-carestino-600 transition-colors">
                    {isEditingStore ? 'Guardar Cambios' : 'Crear Sucursal'}
                 </button>
              </form>
            </div>
         </div>
      )}

    </div>
  );
};
