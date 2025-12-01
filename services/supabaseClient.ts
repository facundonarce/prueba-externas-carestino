
import { createClient } from '@supabase/supabase-js';
import { AuditFormState, AuditReport } from '../types';

// 1. CREDENCIALES POR DEFECTO (Hardcoded Backup)
// Configurado para proyecto: Prueba Externas Carestino (ID: eylylksptswpdmesqnvf)
const FALLBACK_URL = "https://eylylksptswpdmesqnvf.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHlsa3NwdHN3cGRtZXNxbnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODAyNjQsImV4cCI6MjA4MDE1NjI2NH0.vG-YJPueQtXJOKogP0ruljrw2t21op9VeTIpHafk-y8";

// 2. OBTENCIÓN DE VARIABLES DE ENTORNO
// Intentamos leer de múltiples fuentes para asegurar robustez
const getEnvVar = (key: string, fallback: string) => {
    // Intento 1: Vite import.meta.env
    try {
        const metaEnv = (import.meta as any).env;
        if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {
        // Ignorar error si import.meta no existe
    }

    // Intento 2: process.env (inyectado por vite.config.ts)
    try {
        if (process.env && (process.env as any)[key]) return (process.env as any)[key];
    } catch (e) {
        // Ignorar
    }

    // Intento 3: Fallback hardcoded
    return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

// 3. INICIALIZACIÓN DEL CLIENTE
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ ATENCIÓN: Faltan las credenciales de Supabase. Edita services/supabaseClient.ts o configura las variables de entorno.");
} else {
    // console.log("Supabase Client Initialized with URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

/**
 * Convierte un Data URL (Base64) a un objeto Blob para poder subirlo como archivo.
 */
const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

/**
 * Sube la foto de evidencia al Bucket 'fichadas' de Supabase y retorna la URL pública.
 * Si falla, retorna null.
 */
export const uploadEvidencePhoto = async (base64Image: string, userId: string): Promise<string | null> => {
    try {
        const blob = base64ToBlob(base64Image);
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}.jpg`;
        const filePath = `${fileName}`; // Se guarda en la raíz del bucket fichadas

        const { data, error } = await supabase.storage
            .from('fichadas')
            .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error("Error uploading photo to Supabase:", error);
            return null;
        }

        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from('fichadas')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;

    } catch (err) {
        console.error("Unexpected error uploading photo:", err);
        return null;
    }
};

/**
 * Guarda una auditoría completa en la base de datos, incluyendo la subida de todas las fotos asociadas.
 */
export const saveAudit = async (auditData: AuditFormState, report: AuditReport, userId: string): Promise<boolean> => {
    try {
        // 1. Subir todas las fotos primero
        const photoUrls: Record<string, string> = {};
        
        // Iteramos sobre las fotos tomadas (clave: questionId, valor: base64)
        for (const [questionId, base64] of Object.entries(auditData.photos)) {
            // Generamos un "ID de usuario" compuesto para el nombre del archivo: audit_{userId}_{questionId}
            const uniqueName = `audit_${userId}_q${questionId}`;
            const url = await uploadEvidencePhoto(base64, uniqueName);
            
            if (url) {
                photoUrls[questionId] = url;
            }
        }

        // 2. Insertar el registro en la tabla audits
        const { error } = await supabase.from('audits').insert({
            store_id: auditData.storeId,
            user_id: userId,
            answers: auditData.answers,
            photos: photoUrls, // Guardamos las URLs públicas, no el base64
            ai_report: report,
            score: report.score,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error("Error saving audit record:", error);
            throw error;
        }

        return true;

    } catch (error) {
        console.error("Error in saveAudit process:", error);
        return false;
    }
};
