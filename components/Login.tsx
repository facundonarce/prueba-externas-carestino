
import React, { useState, useRef, useEffect } from 'react';
import { User, TimeLog } from '../types';
import { Lock, User as UserIcon, ArrowRight, Loader2, Camera, ShieldCheck, AlertCircle, LogIn, LogOut, CheckCircle, AlertTriangle, Shirt, ShieldAlert, RotateCw, XCircle, Store, MapPin, Navigation, Clock } from 'lucide-react';
import { verifyUserIdentity, VerificationResult } from '../services/geminiService';
import { uploadEvidencePhoto } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  userDatabase: Record<string, User & { password: string }>;
  onClockLog: (log: TimeLog) => void;
  stores: { id: string; name: string; address: string; lat: number; lng: number }[];
  timeLogs: TimeLog[];
}

type LoginStep = 'credentials' | 'store_selection' | 'checking_location' | 'clock_selection' | 'camera' | 'verifying' | 'uploading' | 'verification_failed' | 'success_exit' | 'success_entry';

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

const MAX_ALLOWED_DISTANCE = 200; // meters

export const Login: React.FC<LoginProps> = ({ onLogin, userDatabase, onClockLog, stores, timeLogs }) => {
  // Step 1: Credentials State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // General State
  const [step, setStep] = useState<LoginStep>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  
  // Store Selection State
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string; lat: number; lng: number } | null>(null);
  
  // Location State
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceToStore, setDistanceToStore] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'OK' | 'FAR' | 'ERROR'>('OK');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string>('');

  // Clock In/Out State
  const [clockAction, setClockAction] = useState<'INGRESO' | 'EGRESO' | null>(null);
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);
  const [uniformIssue, setUniformIssue] = useState<string | null>(null);
  const [identityScore, setIdentityScore] = useState<number>(0);

  // Failure State
  const [failedResult, setFailedResult] = useState<VerificationResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Step 2: Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara. Por favor verifique los permisos.");
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const userRecord = userDatabase[username];
      
      if (userRecord && userRecord.password === password) {
        const { password: _, ...userWithoutPassword } = userRecord;
        setPendingUser(userWithoutPassword);
        setIsLoading(false);

        // If Admin, skip everything
        if (userWithoutPassword.role === 'admin') {
          onLogin(userWithoutPassword);
        } else {
          // Verify if user has assigned stores
          if (!userWithoutPassword.assignedStoreIds || userWithoutPassword.assignedStoreIds.length === 0) {
            setError('Usuario sin sucursales asignadas. Contacte a soporte.');
            setPendingUser(null);
          } else {
            // Proceed to Store Selection
            setStep('store_selection');
          }
        }
      } else {
        setError('Usuario o contraseña incorrectos.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleStoreSelection = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setSelectedStore(store);
      // START GEO CHECK
      setStep('checking_location');
      checkGeolocation(store);
    }
  };

  const checkGeolocation = (store: { lat: number; lng: number }) => {
    if (!navigator.geolocation) {
      setLocationStatus('ERROR');
      setLocationErrorMsg("Geolocalización no soportada por el navegador.");
      setStep('clock_selection');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation({ lat, lng });

        const dist = calculateDistance(lat, lng, store.lat, store.lng);
        setDistanceToStore(Math.round(dist));

        if (dist <= MAX_ALLOWED_DISTANCE) {
          setLocationStatus('OK');
        } else {
          setLocationStatus('FAR');
        }
        setStep('clock_selection');
      },
      (error) => {
        console.error("Geo error:", error);
        setLocationStatus('ERROR');
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationErrorMsg("Permiso de ubicación denegado.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationErrorMsg("Ubicación no disponible.");
            break;
          case error.TIMEOUT:
            setLocationErrorMsg("Tiempo de espera agotado.");
            break;
          default:
            setLocationErrorMsg("Error obteniendo ubicación.");
        }
        setStep('clock_selection');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClockSelection = (action: 'INGRESO' | 'EGRESO') => {
    setClockAction(action);
    setStep('camera');
    setTimeout(startCamera, 100);
  };

  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || !pendingUser) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setStep('verifying');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      try {
        const result = await verifyUserIdentity(
          dataUrl, 
          pendingUser.photoUrl, 
          pendingUser.requiredUniform || 'Buzo o campera negra'
        );
        
        // CRITICAL CHECK: If not verified, stop flow and show options
        if (!result.verified) {
          setFailedResult(result);
          setCapturedImage(dataUrl);
          setStep('verification_failed');
          return;
        }

        // If verified, proceed directly
        await processSuccessfulLog(result, dataUrl);

      } catch (err) {
        setError("Error de conexión durante la validación.");
        setStep('camera');
        setTimeout(startCamera, 100);
      }
    }
  };

  const processSuccessfulLog = async (result: VerificationResult, imageBase64: string) => {
    if (!pendingUser) return;

    // Show uploading state if possible or keep 'verifying' loader visually
    setStep('uploading');

    // 1. Upload Image to Supabase Storage
    let finalPhotoUrl = imageBase64; // Fallback to base64 if upload fails
    try {
      const publicUrl = await uploadEvidencePhoto(imageBase64, username);
      if (publicUrl) {
        finalPhotoUrl = publicUrl;
      }
    } catch (e) {
      console.error("Failed to upload image, using base64 fallback", e);
    }

    // Logic to determine if there is an incident
    const identityFailed = !result.verified;
    const locationFailed = locationStatus !== 'OK';
    const isWarning = result.verified && (result.message.includes('AVISO') || result.message.includes('sin foto') || result.message.includes('Advertencia'));
    
    const hasIncident = identityFailed || locationFailed || isWarning;
    
    let incidentDetailsParts = [];
    if (identityFailed) incidentDetailsParts.push(result.message || "Incidencia de identidad forzada");
    if (locationFailed) {
      if (locationStatus === 'FAR') incidentDetailsParts.push(`Ubicación lejana (${distanceToStore}m > ${MAX_ALLOWED_DISTANCE}m)`);
      if (locationStatus === 'ERROR') incidentDetailsParts.push(`Error GPS: ${locationErrorMsg}`);
    }
    if (isWarning) incidentDetailsParts.push(result.message);

    const finalIncidentDetail = incidentDetailsParts.length > 0 ? incidentDetailsParts.join('. ') : undefined;
    
    // UI Feedback logic
    setIdentityScore(result.identityScore);
    setIncidentMessage(finalIncidentDetail || null);

    if (!result.uniformCompliant) {
      setUniformIssue(result.uniformDetails);
    } else {
      setUniformIssue(null);
    }

    // Save the log
    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      userId: username,
      userFullName: pendingUser.fullName,
      userPhotoUrl: finalPhotoUrl, // Now using the Storage URL
      storeId: selectedStore?.id,
      storeName: selectedStore?.name,
      type: clockAction || 'INGRESO',
      timestamp: new Date().toISOString(),
      hasIncident: hasIncident,
      incidentDetail: finalIncidentDetail,
      identityScore: result.identityScore,
      uniformCompliant: result.uniformCompliant,
      uniformDetails: result.uniformDetails,
      // Location Data
      location: currentLocation || undefined,
      locationAllowed: locationStatus === 'OK',
      distanceToStore: distanceToStore || undefined
    };

    onClockLog(newLog);

    // Proceed based on action type
    if (clockAction === 'INGRESO') {
          setStep('success_entry');
          setTimeout(() => onLogin(pendingUser), 6000); 
    } else {
      setStep('success_exit');
      setTimeout(() => {
          window.location.reload();
      }, 5000);
    }
  };

  const handleRetry = () => {
    setFailedResult(null);
    setCapturedImage(null);
    setStep('camera');
    setTimeout(startCamera, 100);
  };

  const handleForceClockIn = async () => {
    if (failedResult && capturedImage) {
      await processSuccessfulLog(failedResult, capturedImage);
    }
  };

  const handleCancelVerification = () => {
    setFailedResult(null);
    setCapturedImage(null);
    setStep('clock_selection');
  };

  const renderCredentialsForm = () => (
    <form onSubmit={handleCredentialsSubmit} className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 ml-1">Usuario</label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-carestino-500 focus:border-transparent outline-none transition-all"
            placeholder="ej. auditor"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-carestino-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-carestino-500 hover:bg-carestino-600 disabled:bg-carestino-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-carestino-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      
      <div className="text-center text-xs text-gray-400">
        User: auditor / admin | Pass: 1234 / admin123
      </div>
    </form>
  );

  const renderStoreSelection = () => {
    const userStores = stores.filter(s => pendingUser?.assignedStoreIds?.includes(s.id));

    return (
      <div className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 text-center">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">Seleccionar Sucursal</h3>
          <p className="text-slate-500 text-sm">¿En qué establecimiento te encuentras?</p>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto no-scrollbar">
          {userStores.map(store => (
            <button
              key={store.id}
              onClick={() => handleStoreSelection(store.id)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-carestino-500 hover:bg-carestino-50 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                <Store className="w-5 h-5 text-slate-500 group-hover:text-carestino-600" />
              </div>
              <div>
                <span className="font-bold text-slate-700 block group-hover:text-carestino-700">{store.name}</span>
                <span className="text-xs text-slate-400 group-hover:text-carestino-500">{store.address}</span>
              </div>
            </button>
          ))}
          
          {userStores.length === 0 && (
            <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">
              No tienes sucursales asignadas. Contacta a tu gerente.
            </div>
          )}
        </div>

        <button 
          onClick={() => { setStep('credentials'); setPendingUser(null); }}
          className="text-sm text-slate-400 hover:text-slate-600 underline mt-2"
        >
          Volver al Login
        </button>
      </div>
    );
  };

  const renderCheckingLocation = () => (
    <div className="p-12 flex flex-col items-center text-center animate-in fade-in duration-300">
      <Loader2 className="w-12 h-12 text-carestino-500 animate-spin mb-6" />
      <h3 className="text-lg font-bold text-slate-800 mb-2">Verificando Ubicación</h3>
      <p className="text-slate-500 max-w-xs text-sm">
        Calculando distancia a {selectedStore?.name}...
      </p>
      <p className="text-xs text-slate-400 mt-4">Por favor permite el acceso al GPS.</p>
    </div>
  );

  const renderClockSelection = () => {
    // Determine Logic State: Is user already clocked in?
    // Get logs for this user, sort descending by time.
    const userLogs = timeLogs
      .filter(log => log.userId === pendingUser?.username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const lastLog = userLogs[0];
    const isClockedIn = lastLog?.type === 'INGRESO';
    
    return (
      <div className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 text-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Hola, {pendingUser?.fullName.split(' ')[0]}
          </h3>
          <p className="text-carestino-600 font-medium text-sm flex items-center justify-center gap-1">
            <Store className="w-3 h-3" />
            {selectedStore?.name}
          </p>
        </div>

        {/* Status Card */}
        {isClockedIn ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-left flex gap-3">
             <div className="bg-blue-100 p-2 rounded-full h-fit">
               <Clock className="w-4 h-4 text-blue-600" />
             </div>
             <div>
               <p className="text-xs font-bold text-blue-800 uppercase">Turno en curso</p>
               <p className="text-xs text-blue-600">
                 Ingreso: {new Date(lastLog.timestamp).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', timeZone: 'America/Buenos_Aires'})} 
                 {lastLog.storeName ? ` en ${lastLog.storeName}` : ''}
               </p>
             </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-left flex gap-3">
             <div className="bg-slate-200 p-2 rounded-full h-fit">
               <Clock className="w-4 h-4 text-slate-500" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-700 uppercase">Fuera de Turno</p>
               <p className="text-xs text-slate-500">
                 {lastLog ? `Última salida: ${new Date(lastLog.timestamp).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', timeZone: 'America/Buenos_Aires'})}` : 'Sin registros previos.'}
               </p>
             </div>
          </div>
        )}

        {/* Location Status Badge */}
        <div className={`p-3 rounded-lg flex items-start gap-3 text-left text-sm ${
          locationStatus === 'OK' ? 'bg-green-50 text-green-800 border border-green-200' :
          locationStatus === 'FAR' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {locationStatus === 'OK' ? <MapPin className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" /> : 
           locationStatus === 'FAR' ? <Navigation className="w-5 h-5 flex-shrink-0 text-orange-600 mt-0.5" /> :
           <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />}
          
          <div>
            <span className="font-bold block">
              {locationStatus === 'OK' ? 'Ubicación Verificada' : 
               locationStatus === 'FAR' ? 'Estás lejos de la sucursal' : 'Error de Ubicación'}
            </span>
            <span className="opacity-90 text-xs">
              {locationStatus === 'OK' ? `Estás a ${distanceToStore}m (Permitido).` :
               locationStatus === 'FAR' ? `Estás a ${distanceToStore}m (Máx ${MAX_ALLOWED_DISTANCE}m). Se registrará incidencia.` :
               locationErrorMsg || "No se pudo validar GPS."}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={isClockedIn}
            onClick={() => handleClockSelection('INGRESO')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group gap-3
              ${isClockedIn 
                ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                : 'border-slate-100 hover:border-green-500 hover:bg-green-50'
              }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isClockedIn ? 'bg-slate-200' : 'bg-green-100 group-hover:bg-green-200'}`}>
              <LogIn className={`w-6 h-6 ${isClockedIn ? 'text-slate-400' : 'text-green-600'}`} />
            </div>
            <span className={`font-bold ${isClockedIn ? 'text-slate-400' : 'text-slate-700 group-hover:text-green-700'}`}>Ingreso</span>
          </button>

          <button
            disabled={!isClockedIn}
            onClick={() => handleClockSelection('EGRESO')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group gap-3
              ${!isClockedIn 
                ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                : 'border-slate-100 hover:border-red-500 hover:bg-red-50'
              }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${!isClockedIn ? 'bg-slate-200' : 'bg-red-100 group-hover:bg-red-200'}`}>
              <LogOut className={`w-6 h-6 ${!isClockedIn ? 'text-slate-400' : 'text-red-600'}`} />
            </div>
            <span className={`font-bold ${!isClockedIn ? 'text-slate-400' : 'text-slate-700 group-hover:text-red-700'}`}>Salida</span>
          </button>
        </div>

        <button 
          onClick={() => { setStep('store_selection'); setSelectedStore(null); }}
          className="text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Cambiar Sucursal
        </button>
      </div>
    );
  };

  const renderCameraView = () => (
    <div className="p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        Validar {clockAction === 'INGRESO' ? 'Ingreso' : 'Salida'}
      </h3>
      <p className="text-sm text-slate-500 mb-6 text-center">
        Analizando identidad y vestimenta.
      </p>

      {error && (
         <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 w-full text-center">
           {error}
         </div>
      )}

      <div className="relative w-64 h-64 bg-black rounded-full overflow-hidden mb-8 border-4 border-carestino-500 shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <div className="absolute inset-0 border-4 border-white/30 rounded-full pointer-events-none"></div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={handleCaptureAndVerify}
        className="w-full bg-carestino-500 hover:bg-carestino-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-carestino-200 active:scale-95"
      >
        <Camera className="w-5 h-5" />
        Capturar y Fichar
      </button>

      <button 
        onClick={() => {
          if(stream) stream.getTracks().forEach(t => t.stop());
          setStep('clock_selection');
        }}
        className="mt-4 text-slate-400 text-sm hover:text-slate-600"
      >
        Volver
      </button>
    </div>
  );

  const renderVerifying = () => (
    <div className="p-12 flex flex-col items-center text-center animate-in fade-in duration-300">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-carestino-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-carestino-500 rounded-full border-t-transparent animate-spin"></div>
        <ShieldCheck className="absolute inset-0 m-auto text-carestino-500 w-10 h-10 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Validando Biometría</h3>
      <p className="text-slate-500 max-w-xs text-sm">
        Verificando rostro y cumplimiento de uniforme...
      </p>
    </div>
  );

  const renderUploading = () => (
    <div className="p-12 flex flex-col items-center text-center animate-in fade-in duration-300">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-carestino-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <Camera className="absolute inset-0 m-auto text-blue-500 w-10 h-10 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Guardando Evidencia</h3>
      <p className="text-slate-500 max-w-xs text-sm">
        Subiendo fotografía a la nube segura...
      </p>
    </div>
  );

  const renderVerificationFailed = () => (
    <div className="p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5 animate-pulse">
        <ShieldAlert className="w-10 h-10 text-red-600" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">Validación Fallida</h3>
      <p className="text-slate-500 mb-4 px-2">{failedResult?.message || "No se pudo validar la identidad."}</p>

      {/* Metrics Card */}
      <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Coincidencia</span>
          <span className="text-sm font-bold text-red-600">{failedResult?.identityScore}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
           <div 
             className="h-full bg-red-500 transition-all duration-1000" 
             style={{ width: `${failedResult?.identityScore}%` }} 
           />
        </div>
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded text-left">
          El sistema ha detectado una anomalía. Puede reintentar, fichar dejando constancia de la incidencia o salir.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={handleRetry}
          className="w-full bg-carestino-500 hover:bg-carestino-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <RotateCw className="w-5 h-5" />
          Volver a Intentar
        </button>

        <button 
          onClick={handleForceClockIn}
          className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" />
          Fichar con Incidencia
        </button>

        <button 
          onClick={handleCancelVerification}
          className="w-full text-slate-400 hover:text-slate-600 font-medium py-2 text-sm flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Cancelar y Salir
        </button>
      </div>
    </div>
  );

  const renderResult = (title: string, subtitle: string) => (
    <div className="p-8 flex flex-col items-center text-center animate-in fade-in duration-500">
      {incidentMessage || uniformIssue ? (
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-yellow-600" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      )}
      
      <h3 className="text-2xl font-bold text-slate-800 mb-1">
        {selectedStore?.name}
      </h3>
      <p className="text-carestino-600 font-bold mb-4 uppercase text-sm tracking-wide">{title}</p>
      <p className="text-slate-500 mb-6 text-sm">{subtitle}</p>

      {/* Metrics Card */}
      <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
        {/* Identity Metric */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Identidad</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${identityScore >= 80 ? 'bg-green-500' : identityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                style={{ width: `${identityScore}%` }} 
              />
            </div>
            <span className={`text-sm font-bold ${identityScore >= 80 ? 'text-green-600' : 'text-red-600'}`}>
              {identityScore}%
            </span>
          </div>
        </div>
        
        {incidentMessage && (
           <p className={`text-xs text-left p-2 rounded flex items-start gap-1 font-medium ${
               incidentMessage.includes('AVISO') || incidentMessage.includes('Advertencia')
               ? 'text-yellow-700 bg-yellow-50' 
               : 'text-red-500 bg-red-50'
             }`}>
             <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
             {incidentMessage}
           </p>
        )}

        {/* Uniform Metric */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
            <Shirt className="w-4 h-4" /> Uniforme
          </span>
          {uniformIssue ? (
            <span className="text-sm font-bold text-yellow-600">Revisión Requerida</span>
          ) : (
            <span className="text-sm font-bold text-green-600">Correcto</span>
          )}
        </div>
        
        {uniformIssue && (
           <p className="text-xs text-yellow-700 text-left bg-yellow-50 p-2 rounded">
             {uniformIssue}
           </p>
        )}

        {/* Location Metric (Only in result if incident) */}
        {locationStatus !== 'OK' && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> Ubicación
            </span>
            <span className="text-sm font-bold text-red-600">Incidencia</span>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-slate-400">Redireccionando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-all duration-300">
        
        {/* Header - changes based on state */}
        <div className={`p-8 text-center transition-all duration-300 ${
          step === 'success_exit' || step === 'success_entry' 
            ? (incidentMessage || uniformIssue) ? 'bg-yellow-500' : 'bg-green-600' 
            : step === 'verification_failed' 
              ? 'bg-red-600'
              : 'bg-carestino-500'
        }`}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 shadow-lg backdrop-blur-sm">
            {step === 'credentials' ? <Lock className="w-8 h-8 text-white" /> : 
             step === 'store_selection' ? <Store className="w-8 h-8 text-white" /> :
             step === 'checking_location' ? <MapPin className="w-8 h-8 text-white animate-bounce" /> :
             step === 'clock_selection' ? <UserIcon className="w-8 h-8 text-white" /> :
             step === 'success_exit' ? <LogOut className="w-8 h-8 text-white" /> :
             step === 'success_entry' ? <LogIn className="w-8 h-8 text-white" /> :
             step === 'verification_failed' ? <ShieldAlert className="w-8 h-8 text-white" /> :
             step === 'uploading' ? <Camera className="w-8 h-8 text-white animate-pulse" /> :
             <Camera className="w-8 h-8 text-white" />
            }
          </div>
          <h1 className="text-2xl font-bold text-white">Auditorias Carestino</h1>
          <p className="text-white/80 mt-2">
            {step === 'credentials' ? 'Acceso a plataforma' : 
             step === 'store_selection' ? 'Punto de Venta' :
             step === 'checking_location' ? 'Geolocalización' :
             step === 'clock_selection' ? 'Control de Asistencia' :
             step === 'success_exit' || step === 'success_entry' ? 'Registro Procesado' :
             step === 'verification_failed' ? 'Atención Requerida' :
             step === 'uploading' ? 'Guardando Evidencia' :
             'Validación Biométrica'}
          </p>
        </div>
        
        {step === 'credentials' && renderCredentialsForm()}
        {step === 'store_selection' && renderStoreSelection()}
        {step === 'checking_location' && renderCheckingLocation()}
        {step === 'clock_selection' && renderClockSelection()}
        {step === 'camera' && renderCameraView()}
        {step === 'verifying' && renderVerifying()}
        {step === 'uploading' && renderUploading()}
        {step === 'verification_failed' && renderVerificationFailed()}
        {step === 'success_exit' && renderResult('¡Hasta mañana!', 'Tu horario de salida ha sido registrado.')}
        {step === 'success_entry' && renderResult('¡Bienvenido!', 'Ingreso registrado correctamente.')}
        
        {step === 'credentials' && (
           <div className="bg-slate-50 p-4 text-center text-xs text-gray-400 border-t border-slate-100">
            v2.3.0 | Carestino Secure Access
          </div>
        )}
      </div>
    </div>
  );
};
