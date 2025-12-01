import React from 'react';
import { User } from '../types';
import { Plus, History, Store, BarChart3, ChevronRight, LogOut } from 'lucide-react';

interface DashboardProps {
  user: User;
  onStartAudit: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onStartAudit, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-carestino-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-slate-800 text-xl tracking-tight">Auditorias Carestino</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-700">{user.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-carestino-500 rounded-2xl p-6 text-white shadow-lg shadow-carestino-200 flex flex-col justify-between h-48 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" onClick={onStartAudit}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Plus className="w-24 h-24" />
            </div>
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Nueva Auditoría</h3>
              <p className="text-carestino-100 text-sm mt-1">Comenzar auditoría Externa</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-48 hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Historial</h3>
              <p className="text-slate-500 text-sm mt-1">Ver auditorías completadas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-48 hover:border-purple-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Métricas</h3>
              <p className="text-slate-500 text-sm mt-1">KPIs y cumplimiento global</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Auditorías Recientes</h3>
            <button className="text-carestino-500 text-sm font-medium hover:underline">Ver todas</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((item) => (
              <div key={item} className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Sucursal {item === 1 ? 'Centro' : item === 2 ? 'Norte' : 'Sur'}</h4>
                    <p className="text-xs text-slate-400">Hace {item} días • Completada</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${item === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item === 1 ? '94/100' : '82/100'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-carestino-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};