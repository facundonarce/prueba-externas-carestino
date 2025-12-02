
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
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Buenos_Aires' });
    const day = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Buenos_Aires' });
    return { time, day };
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
      {/* Admin Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
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
                               <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" />
                                 Sin problemas
                               </span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                               onClick={() => setSelectedAudit(audit)}
                               className="text-carestino-500 hover:text-carestino-700 font-medium text-sm flex items-center justify-end gap-1"
                            >
                               Ver Reporte <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
              </table>
              {audits.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">No hay auditorías registradas.</div>
              )}
            </div>
          </div>
        )}

        {/* Content - Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800">Directorio de Empleados</h2>
               <button 
                 onClick={handleOpenCreateUserModal}
                 className="bg-carestino-500 hover:bg-carestino-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-carestino-200 transition-all"
               >
                 <Plus className="w-5 h-5" />
                 Nuevo Usuario
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(userDatabase).map((u: User & { password: string }) => (
                <div key={u.username} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-carestino-300 transition-all shadow-sm group relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEditUserModal(u)}
                      className="p-2 bg-slate-100 hover:bg-carestino-50 text-slate-500 hover:text-carestino-600 rounded-full transition-colors"
                      title="Editar Usuario"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner flex-shrink-0 group-hover:border-carestino-100 transition-colors">
                      <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{u.fullName}</h3>
                      <p className="text-sm text-carestino-600 font-medium mb-1">{u.jobTitle}</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                     <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                       <Shirt className="w-3.5 h-3.5" />
                       Uniforme: {u.requiredUniform || 'Estándar'}
                     </div>
                     <div className="text-xs text-slate-500 font-medium flex items-start gap-2">
                       <StoreIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                       <span>
                         {u.assignedStoreIds && u.assignedStoreIds.length > 0 
                           ? u.assignedStoreIds.map(sid => stores.find(s => s.id === sid)?.name || sid).join(', ') 
                           : 'Sin asignación'}
                       </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content - Stores */}
        {activeTab === 'stores' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-800">Sucursales Activas</h2>
                     <button
                         onClick={handleOpenCreateStoreModal}
                         className="bg-carestino-500 hover:bg-carestino-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-carestino-200 transition-all"
                     >
                         <Plus className="w-5 h-5" />
                         Nueva Sucursal
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {stores.map((store) => (
                         <div key={store.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-carestino-300 transition-all shadow-sm group relative">
                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button
                                     onClick={() => handleOpenEditStoreModal(store)}
                                     className="p-2 bg-slate-100 hover:bg-carestino-50 text-slate-500 hover:text-carestino-600 rounded-full transition-colors"
                                     title="Editar Sucursal"
                                 >
                                     <Pencil className="w-4 h-4" />
                                 </button>
                             </div>
                             
                             <div className="flex items-center gap-4 mb-4">
                                 <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-carestino-500">
                                     <StoreIcon className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-slate-800 text-lg leading-tight">{store.name}</h3>
                                     <p className="text-xs text-slate-400 font-mono mt-0.5">{store.id}</p>
                                 </div>
                             </div>

                             <div className="space-y-3">
                                 <div className="flex items-start gap-2 text-sm text-slate-600">
                                     <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-carestino-400" />
                                     <span>{store.address}</span>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                     <span>Lat: {store.lat.toFixed(6)}</span>
                                     <span>Lng: {store.lng.toFixed(6)}</span>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        )}
      </main>

      {/* Modal - Log Detail */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedLog.type === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedLog.type === 'INGRESO' ? <Clock className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800">Detalle de Fichada</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedLog.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Photo & Main Info */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Evidencia Fotográfica</label>
                      <div className="w-full aspect-square rounded-xl overflow-hidden border-4 border-slate-100 shadow-inner bg-black">
                        {selectedLog.userPhotoUrl ? (
                          <img src={selectedLog.userPhotoUrl} className="w-full h-full object-cover" alt="Log Evidence" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">Sin foto</div>
                        )}
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                            {selectedLog.userFullName.charAt(0)}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{selectedLog.userFullName}</p>
                            <p className="text-xs text-slate-500">{selectedLog.userId}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                         <Calendar className="w-4 h-4" />
                         {formatDateTimeBA(selectedLog.timestamp).day} {formatDateTimeBA(selectedLog.timestamp).time}
                      </div>
                   </div>
                </div>

                {/* Right Column: Analysis */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Validación Biométrica</label>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-slate-600">Confianza de Identidad</span>
                            <span className={`text-2xl font-black ${selectedLog.identityScore >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedLog.identityScore}%
                            </span>
                         </div>
                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                           <div 
                             className={`h-full ${selectedLog.identityScore >= 80 ? 'bg-green-500' : 'bg-red-500'}`}
                             style={{ width: `${selectedLog.identityScore}%` }}
                           ></div>
                         </div>
                         
                         {selectedLog.hasIncident && (
                           <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs">
                             <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                             <p>{selectedLog.incidentDetail || "Incidencia de identidad detectada."}</p>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Estado de Uniforme</label>
                      <div className={`border rounded-xl p-4 flex items-start gap-3 ${selectedLog.uniformCompliant ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                         {selectedLog.uniformCompliant ? (
                           <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                         ) : (
                           <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                         )}
                         <div>
                           <p className={`font-bold text-sm ${selectedLog.uniformCompliant ? 'text-green-800' : 'text-yellow-800'}`}>
                             {selectedLog.uniformCompliant ? 'Cumple Requisitos' : 'Revisión Necesaria'}
                           </p>
                           <p className={`text-xs mt-1 ${selectedLog.uniformCompliant ? 'text-green-700' : 'text-yellow-700'}`}>
                             {selectedLog.uniformDetails || 'Sin detalles adicionales.'}
                           </p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Ubicación</label>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                         <div className="flex items-start gap-3 mb-3">
                            <StoreIcon className="w-5 h-5 text-carestino-500 mt-0.5" />
                            <div>
                               <p className="font-bold text-slate-800 text-sm">{selectedLog.storeName || 'Tienda desconocida'}</p>
                               <p className="text-xs text-slate-500">Distancia: {selectedLog.distanceToStore !== undefined ? `${selectedLog.distanceToStore}m` : 'N/A'}</p>
                            </div>
                         </div>
                         {selectedLog.location && (
                           <a 
                             href={`https://www.google.com/maps?q=${selectedLog.location.lat},${selectedLog.location.lng}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                           >
                             <MapPin className="w-3 h-3" />
                             Ver en Google Maps
                             <ExternalLink className="w-3 h-3" />
                           </a>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modal - Audit Detail */}
      {selectedAudit && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                     <div>
                         <h3 className="font-bold text-xl text-slate-800">Reporte de Auditoría</h3>
                         <p className="text-xs text-slate-500">ID: {selectedAudit.id}</p>
                     </div>
                     <button onClick={() => setSelectedAudit(null)} className="text-slate-400 hover:text-slate-600">
                         <X className="w-6 h-6" />
                     </button>
                 </div>
                 
                 <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-1 space-y-4">
                         <div className={`p-6 rounded-xl border text-center ${
                             selectedAudit.score >= 90 ? 'bg-green-50 border-green-200 text-green-800' :
                             selectedAudit.score >= 70 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                             'bg-red-50 border-red-200 text-red-800'
                         }`}>
                             <div className="text-4xl font-black">{selectedAudit.score}</div>
                             <div className="text-xs font-bold uppercase mt-1">Puntaje General</div>
                         </div>
                         
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <div className="flex flex-col gap-2">
                                 <div>
                                     <span className="text-xs text-slate-400 font-bold uppercase">Sucursal</span>
                                     <p className="font-bold text-slate-800">{stores.find(s => s.id === selectedAudit.store_id)?.name}</p>
                                 </div>
                                 <div>
                                     <span className="text-xs text-slate-400 font-bold uppercase">Auditor</span>
                                     <p className="font-medium text-slate-700">{userDatabase[selectedAudit.user_id]?.fullName || selectedAudit.user_id}</p>
                                 </div>
                                 <div>
                                     <span className="text-xs text-slate-400 font-bold uppercase">Fecha</span>
                                     <p className="font-medium text-slate-700">
                                         {formatDateTimeBA(selectedAudit.created_at).day} {formatDateTimeBA(selectedAudit.created_at).time}
                                     </p>
                                 </div>
                             </div>
                         </div>
                     </div>
                     
                     <div className="md:col-span-2 space-y-6">
                         <div>
                             <h4 className="font-bold text-lg text-slate-800 mb-2">Resumen Ejecutivo</h4>
                             <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                 {selectedAudit.ai_report.summary}
                             </p>
                         </div>

                         {selectedAudit.ai_report.criticalIssues.length > 0 && (
                             <div>
                                 <h4 className="font-bold text-lg text-red-600 mb-2 flex items-center gap-2">
                                     <AlertTriangle className="w-5 h-5" />
                                     Hallazgos Críticos
                                 </h4>
                                 <ul className="list-disc pl-5 space-y-1 text-slate-700">
                                     {selectedAudit.ai_report.criticalIssues.map((issue, i) => (
                                         <li key={i}>{issue}</li>
                                     ))}
                                 </ul>
                             </div>
                         )}
                         
                         <div>
                             <h4 className="font-bold text-lg text-carestino-600 mb-2">Evidencias Fotográficas</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                 {Object.entries(selectedAudit.photos).map(([key, url]) => (
                                     <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="block relative group aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                         <img src={url} alt="Evidencia" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                             <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                         </div>
                                     </a>
                                 ))}
                                 {Object.keys(selectedAudit.photos).length === 0 && (
                                     <p className="text-slate-400 italic text-sm">No se adjuntaron fotos.</p>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* Modal - Add/Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-xl text-slate-800">
                {isEditingUser ? 'Editar Usuario' : 'Registrar Nuevo Empleado'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUserFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                    placeholder="ej. Ana Gomez"
                    value={userData.fullName || ''}
                    onChange={e => setUserData({...userData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Puesto / Cargo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                    placeholder="ej. Vendedora"
                    value={userData.jobTitle || ''}
                    onChange={e => setUserData({...userData, jobTitle: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Usuario {isEditingUser && <span className="text-xs text-slate-400 font-normal">(No editable)</span>}</label>
                  <input 
                    required
                    type="text" 
                    disabled={isEditingUser}
                    className={`w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none ${isEditingUser ? 'bg-slate-100 text-slate-500' : ''}`}
                    placeholder="ej. agomez"
                    value={userData.username || ''}
                    onChange={e => setUserData({...userData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Contraseña</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                    placeholder="••••••"
                    value={userData.password || ''}
                    onChange={e => setUserData({...userData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Código de Vestimenta (Uniforme)</label>
                 <div className="relative">
                   <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input 
                     type="text" 
                     className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                     placeholder="ej. Buzo o campera negra"
                     value={userData.requiredUniform || ''}
                     onChange={e => setUserData({...userData, requiredUniform: e.target.value})}
                   />
                 </div>
              </div>

              {/* Store Assignment */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="text-sm font-bold text-slate-700 block mb-2">Asignar Sucursales</label>
                <div className="space-y-2">
                  {stores.map(store => (
                    <label key={store.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${userData.assignedStoreIds?.includes(store.id) ? 'bg-carestino-500 border-carestino-500' : 'bg-white border-slate-300'}`}>
                        {userData.assignedStoreIds?.includes(store.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={userData.assignedStoreIds?.includes(store.id)}
                        onChange={() => toggleStoreAssignment(store.id)}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">{store.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-slate-700 block">Foto de Referencia (Biometría)</label>
                <div className="flex items-center gap-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
                     {userData.photoUrl ? (
                       <img src={userData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <Users className="w-8 h-8 text-slate-300" />
                     )}
                   </div>
                   <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                   />
                   <button 
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                   >
                     <Upload className="w-4 h-4" />
                     {userData.photoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                   </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-carestino-500 hover:bg-carestino-600 text-white rounded-xl font-bold shadow-lg shadow-carestino-200 transition-colors"
                >
                  {isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add/Edit Store */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-800">
                        {isEditingStore ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h3>
                    <button onClick={() => setShowStoreModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleStoreFormSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nombre de la Sucursal</label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                            placeholder="ej. Sucursal Belgrano"
                            value={storeData.name || ''}
                            onChange={e => setStoreData({ ...storeData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Dirección</label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                            placeholder="ej. Av. Cabildo 1234"
                            value={storeData.address || ''}
                            onChange={e => setStoreData({ ...storeData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Latitud</label>
                            <input
                                required
                                type="number"
                                step="any"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                                placeholder="-34.6037"
                                value={storeData.lat || ''}
                                onChange={e => setStoreData({ ...storeData, lat: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Longitud</label>
                            <input
                                required
                                type="number"
                                step="any"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
                                placeholder="-58.3815"
                                value={storeData.lng || ''}
                                onChange={e => setStoreData({ ...storeData, lng: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    
                    {/* Map Hint */}
                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                         <MapPin className="w-4 h-4 flex-shrink-0" />
                         <span>Puede obtener las coordenadas desde Google Maps haciendo clic derecho en la ubicación y copiando los números (lat, lng).</span>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowStoreModal(false)}
                            className="px-5 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-carestino-500 hover:bg-carestino-600 text-white rounded-xl font-bold shadow-lg shadow-carestino-200 transition-colors"
                        >
                            {isEditingStore ? 'Guardar Cambios' : 'Crear Sucursal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};
