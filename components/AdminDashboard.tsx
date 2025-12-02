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
                             )