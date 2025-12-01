
import React, { useState, useRef, useEffect } from 'react';
import { QUESTIONS, AuditFormState, AuditReport, Store, Question, User } from '../types';
import { Camera, Trash2, CheckCircle, AlertTriangle, Loader2, Save, FileText, ArrowLeft, RotateCw } from 'lucide-react';
import { generateAuditAnalysis } from '../services/geminiService';
import { saveAudit } from '../services/supabaseClient';

interface AuditFormProps {
  onCancel: () => void;
  stores: Store[];
  user: User;
}

export const AuditForm: React.FC<AuditFormProps> = ({ onCancel, stores, user }) => {
  const [step, setStep] = useState<'form' | 'review' | 'analysis'>('form');
  const [formData, setFormData] = useState<AuditFormState>({
    storeId: '',
    answers: {},
    photos: {}
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Helper to check if a question should be visible
  const isQuestionVisible = (q: Question) => {
    if (!q.dependsOn) return true;
    return formData.answers[q.dependsOn.questionId] === q.dependsOn.value;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setFormData(prev => {
      const newAnswers = { ...prev.answers, [questionId]: value };
      
      // Clean up children questions if parent value changes causing them to hide
      const visibleQIds = QUESTIONS.filter(q => {
        if (!q.dependsOn) return true;
        // Check dependency against NEW answers
        return newAnswers[q.dependsOn.questionId] === q.dependsOn.value;
      }).map(q => q.id);

      const filteredAnswers: Record<string, string> = {};
      const filteredPhotos: Record<string, string> = {};

      visibleQIds.forEach(id => {
        if (newAnswers[id]) filteredAnswers[id] = newAnswers[id];
        if (prev.photos[id]) filteredPhotos[id] = prev.photos[id];
      });

      return {
        ...prev,
        answers: filteredAnswers,
        photos: filteredPhotos
      };
    });
  };

  const handlePhotoUpload = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor suba una imagen menor a 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: { ...prev.photos, [questionId]: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (questionId: string) => {
    setFormData(prev => {
      const newPhotos = { ...prev.photos };
      delete newPhotos[questionId];
      return { ...prev, photos: newPhotos };
    });
    // Reset input value to allow re-uploading same file if needed
    if (fileInputRefs.current[questionId]) {
      fileInputRefs.current[questionId]!.value = '';
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setStep('analysis');
    try {
      const analysis = await generateAuditAnalysis(formData);
      setReport(analysis);
    } catch (error) {
      console.error(error);
      setError("No se pudo generar el reporte. Por favor verifique su conexión e intente nuevamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAudit = async () => {
      if (!report) return;
      
      setIsSaving(true);
      try {
          const success = await saveAudit(formData, report, user.username);
          if (success) {
              alert("Auditoría guardada exitosamente.");
              onCancel(); // Volver al dashboard
          } else {
              alert("Hubo un error guardando la auditoría. Intente nuevamente.");
          }
      } catch (e) {
          console.error(e);
          alert("Error de conexión.");
      } finally {
          setIsSaving(false);
      }
  };

  // Logic to determine if form is complete
  const visibleQuestions = QUESTIONS.filter(q => isQuestionVisible(q));
  const isFormComplete = visibleQuestions.every(q => {
    // 1. Must have an answer
    const hasAnswer = !!formData.answers[q.id];
    if (!hasAnswer) return false;

    // 2. If photo is required based on answer, must have photo
    const currentAnswer = formData.answers[q.id];
    const isPhotoRequired = q.photoRequiredIf?.includes(currentAnswer);
    if (isPhotoRequired && !formData.photos[q.id]) return false;

    return true;
  });

  const renderForm = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Punto de Venta</label>
        <select
          value={formData.storeId}
          onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-carestino-500 outline-none"
        >
          <option value="">-- Seleccione Sucursal --</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name} - {store.address}</option>
          ))}
        </select>
      </div>

      {formData.storeId && visibleQuestions.map((q, index) => {
        const currentAnswer = formData.answers[q.id];
        const isPhotoRequired = q.photoRequiredIf?.includes(currentAnswer || '');

        return (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-carestino-600 uppercase tracking-wide bg-carestino-50 px-2 py-1 rounded">
                  {q.category}
                </span>
                <h3 className="text-lg font-medium text-slate-800 mt-2">
                   {q.text}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {q.type === 'select' ? (
                <select
                  value={formData.answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-700 focus:border-carestino-500 focus:ring-1 focus:ring-carestino-500 outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Seleccione una opción --</option>
                  {q.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                 <textarea
                  value={formData.answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Escriba el detalle..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-700 focus:border-carestino-500 focus:ring-1 focus:ring-carestino-500 outline-none bg-white min-h-[100px]"
                />
              )}

              {/* Photo Section */}
              <div className="flex items-center gap-4 pt-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={el => { fileInputRefs.current[q.id] = el }}
                  onChange={(e) => handlePhotoUpload(q.id, e)}
                />
                
                {!formData.photos[q.id] ? (
                  <button
                    onClick={() => fileInputRefs.current[q.id]?.click()}
                    className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-dashed 
                      ${isPhotoRequired 
                        ? 'text-red-500 bg-red-50 border-red-300 hover:bg-red-100 animate-pulse' 
                        : 'text-slate-500 hover:text-carestino-500 hover:bg-carestino-50 border-slate-300 hover:border-carestino-400'
                      }`}
                  >
                    <Camera className="w-4 h-4" />
                    {isPhotoRequired ? 'Foto Requerida (Obligatorio)' : 'Adjuntar Foto (Opcional)'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-lg border border-green-100 w-full animate-in fade-in">
                    <div className="w-10 h-10 rounded overflow-hidden shadow-sm flex-shrink-0 relative group">
                      <img 
                        src={formData.photos[q.id]} 
                        alt="Evidence" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="text-sm text-green-700 font-medium flex-grow truncate">Foto adjuntada</span>
                    <button
                      onClick={() => removePhoto(q.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {formData.storeId && (
        <div className="sticky bottom-4 z-10 pt-4">
          <button
            onClick={() => setStep('review')}
            disabled={!isFormComplete}
            className={`w-full py-4 rounded-xl shadow-lg font-bold text-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
              ${isFormComplete
                ? 'bg-carestino-500 hover:bg-carestino-600 text-white shadow-carestino-200'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
          >
            Revisar Auditoría
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderReview = () => {
    const questionsToReview = QUESTIONS.filter(q => isQuestionVisible(q));

    return (
      <div className="animate-in slide-in-from-right duration-300 space-y-6">
        <div className="bg-carestino-50 border border-carestino-100 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-carestino-700">Resumen de Auditoría</h2>
          <p className="text-carestino-600">Por favor verifique los datos antes de procesar.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          <div className="p-4 flex justify-between bg-slate-50">
            <span className="text-slate-500 font-medium">Tienda</span>
            <span className="font-bold text-slate-800">{stores.find(s => s.id === formData.storeId)?.name}</span>
          </div>
          {questionsToReview.map(q => (
            <div key={q.id} className="p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">{q.category}</span>
              <div className="flex flex-col gap-1">
                <span className="text-slate-800 font-medium">{q.text}</span>
                <span className="text-carestino-500 font-bold">{formData.answers[q.id]}</span>
              </div>
              {formData.photos[q.id] && (
                <div className="mt-2">
                   <img src={formData.photos[q.id]} alt="Evidence" className="h-24 w-auto rounded-lg border border-slate-200 shadow-sm" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 sticky bottom-4">
          <button
            onClick={() => setStep('form')}
            className="flex-1 py-3 px-6 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <button
            onClick={handleAnalyze}
            className="flex-1 py-3 px-6 bg-carestino-600 text-white font-bold rounded-xl hover:bg-carestino-700 shadow-lg shadow-carestino-200 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <FileText className="w-5 h-5" />
            Analizar con IA
          </button>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    if (isAnalyzing || isSaving) {
      return (
        <div className="flex flex-col items-center justify-center h-96 animate-in fade-in">
          <Loader2 className="w-16 h-16 text-carestino-500 animate-spin mb-6" />
          <h3 className="text-xl font-bold text-slate-800">
            {isSaving ? "Guardando Auditoría..." : "Analizando Auditoría..."}
          </h3>
          <p className="text-slate-500 text-center mt-2 max-w-xs">
            {isSaving 
               ? "Subiendo evidencias y registrando resultados en la base de datos segura." 
               : "Gemini AI está procesando sus respuestas e imágenes para generar un reporte de cumplimiento."
            }
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 animate-in fade-in p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Error en el análisis</h3>
          <p className="text-slate-500 mt-2 mb-6">{error}</p>
          <button 
            onClick={() => setStep('review')}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Volver y Reintentar
          </button>
        </div>
      );
    }

    if (!report) return null;

    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
      if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className={`p-8 rounded-2xl border-2 text-center ${getScoreColor(report.score)}`}>
          <span className="text-sm font-bold uppercase tracking-widest opacity-80">Puntaje de Cumplimiento</span>
          <div className="text-6xl font-black mt-2 mb-2">{report.score}/100</div>
          <p className="font-medium opacity-90">{report.summary}</p>
        </div>

        {report.criticalIssues.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg mb-4">
              <AlertTriangle className="w-5 h-5" />
              Problemas Críticos
            </h3>
            <ul className="space-y-3">
              {report.criticalIssues.map((issue, i) => (
                <li key={i} className="flex gap-3 text-slate-700">
                  <span className="text-red-400 font-bold">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="flex items-center gap-2 text-carestino-500 font-bold text-lg mb-4">
            <CheckCircle className="w-5 h-5" />
            Recomendaciones
          </h3>
          <ul className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg">
                <span className="text-carestino-400 font-bold flex-shrink-0 mt-0.5">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSaveAudit}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
        >
          <Save className="w-5 h-5" />
          Finalizar y Guardar Auditoría
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {step === 'form' ? 'Nueva Auditoría Externa' : step === 'review' ? 'Revisión' : 'Reporte IA'}
        </h2>
        {(step !== 'analysis' && !isSaving) && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-medium">
            Cancelar
          </button>
        )}
      </div>
      
      {step === 'form' && renderForm()}
      {step === 'review' && renderReview()}
      {step === 'analysis' && renderAnalysis()}
    </div>
  );
};
