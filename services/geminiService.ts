
import { GoogleGenAI, Type } from "@google/genai";
import { AuditFormState, QUESTIONS, STORES, AuditReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract clean base64
const cleanBase64 = (dataUrl: string) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return null;
};

export interface VerificationResult {
  verified: boolean;
  identityScore: number;
  message: string;
  uniformCompliant: boolean;
  uniformDetails: string;
}

export const verifyUserIdentity = async (capturedSelfie: string, referencePhotoUrl: string, requiredUniform: string = "Ropa casual"): Promise<VerificationResult> => {
  try {
    const selfieData = cleanBase64(capturedSelfie);
    const referenceData = cleanBase64(referencePhotoUrl);
    
    if (!selfieData) {
      throw new Error("Invalid selfie data format");
    }

    const parts: any[] = [];
    
    // Add Selfie (Image 1)
    parts.push({ 
      inlineData: {
        mimeType: selfieData.mimeType,
        data: selfieData.data
      }
    });

    let promptText = "";

    if (referenceData) {
        // CASE A: Reference is a REAL PHOTO (Base64) -> STRICT BIOMETRIC CHECK
        parts.push({
            inlineData: {
                mimeType: referenceData.mimeType,
                data: referenceData.data
            }
        });
        
        promptText = `ACTÚA COMO UN AUDITOR DE SEGURIDAD BIOMÉTRICA EXTREMADAMENTE ESTRICTO.
        Analiza estas DOS imágenes.
        IMAGEN 1: Selfie en vivo (Persona intentando fichar).
        IMAGEN 2: Foto de referencia oficial (Legajo).

        TIENES QUE REALIZAR ESTAS 3 VALIDACIONES OBLIGATORIAS. SI FALLA LA 1 O LA 2, RECHAZA INMEDIATAMENTE.

        1. VALIDACIÓN DE PERSONA (LIVENESS CHECK):
           - ¿La IMAGEN 1 muestra a un ser humano real mirando a la cámara?
           - Si es un objeto, un animal, una foto oscura o irreconocible -> RECHAZA ("verified": false).

        2. VALIDACIÓN DE IDENTIDAD (BIOMETRÍA 1:1):
           - Compara los rasgos faciales ESTRUCTURALES de IMAGEN 1 vs IMAGEN 2 (Ojos, Nariz, Boca, Mentón).
           - ¿Son la MISMA persona? 
           - CRÍTICO: Si son personas diferentes (ej. diferente género, diferente etnia, o rasgos faciales claramente distintos) DEBES devolver "verified": false y un "identityScore" MUY BAJO (entre 0 y 25).
           - NO aceptes parecidos vagos. Tiene que ser la misma persona.

        3. VALIDACIÓN DE VESTIMENTA:
           - Requisito: "${requiredUniform}"
           - ¿La persona en IMAGEN 1 cumple con el requisito?
           - Define "uniformCompliant" y explica en "uniformDetails".

        Responde EXCLUSIVAMENTE con el JSON solicitado.`;

    } else {
        // CASE B: Reference is NOT a photo (It is a URL/Avatar) -> PERMISSIVE MODE WITH WARNING
        // Only validate that the input is a human and check uniform.
        promptText = `Estás validando el ingreso de un empleado que NO TIENE FOTO REAL DE REFERENCIA cargada en el sistema (usa un Avatar: ${referencePhotoUrl}).

        TAREA 1: PRUEBA DE VIDA (CRÍTICO)
        - Analiza la imagen adjunta (Selfie).
        - ¿Es un ser humano real? 
        - SI ES UN HUMANO: Devuelve "verified": true. IMPORTANTE: En el campo "message" DEBES escribir exactamente: "⚠️ AVISO: Usuario sin foto de referencia. Identidad no validada, solo presencia humana.". Pon un "identityScore" de 100 (ya que no hay contra qué comparar).
        - SI NO ES HUMANO (Es una pared, objeto, animal, o negro): Devuelve "verified": false.

        TAREA 2: UNIFORME
        - Verifica si la persona cumple con: "${requiredUniform}".

        Responde SOLAMENTE con JSON.`;
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN, description: "Resultado de la validación de acceso." },
            identityScore: { type: Type.NUMBER, description: "Puntaje de confianza (0-100)." },
            message: { type: Type.STRING, description: "Mensaje explicativo o advertencia." },
            uniformCompliant: { type: Type.BOOLEAN, description: "True si cumple vestimenta." },
            uniformDetails: { type: Type.STRING, description: "Detalle de la vestimenta." }
          },
          required: ["verified", "identityScore", "message", "uniformCompliant", "uniformDetails"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      verified: result.verified || false,
      identityScore: result.identityScore || 0,
      message: result.message || "No se pudo verificar.",
      uniformCompliant: result.uniformCompliant ?? true,
      uniformDetails: result.uniformDetails || "No se pudo analizar la vestimenta."
    };

  } catch (error) {
    console.error("Identity verification error:", error);
    return { 
      verified: false, 
      identityScore: 0, 
      message: "Error técnico conectando con servicio de IA.",
      uniformCompliant: false,
      uniformDetails: "Error de análisis."
    };
  }
};

export const generateAuditAnalysis = async (auditData: AuditFormState): Promise<AuditReport> => {
  try {
    const store = STORES.find(s => s.id === auditData.storeId);
    
    // Prepare textual data
    let promptText = `Actúa como un experto auditor de Retail (Puntos de Venta). Analiza los datos de la siguiente auditoría realizada en: ${store?.name || 'Tienda Desconocida'}.\n\n`;
    
    promptText += "Respuestas del cuestionario:\n";
    QUESTIONS.forEach(q => {
      const answer = auditData.answers[q.id] || "Sin respuesta";
      promptText += `- Pregunta: "${q.text}" (Categoría: ${q.category})\n  Respuesta: "${answer}"\n`;
    });

    promptText += "\nBasado en estas respuestas y las imágenes proporcionadas (si las hay), genera un reporte JSON estructurado que evalúe el estado del punto de venta. Sé crítico pero constructivo.";

    // Prepare image parts
    const parts: any[] = [{ text: promptText }];
    
    // Add images if they exist
    Object.entries(auditData.photos).forEach(([qId, base64String]) => {
      const imgData = cleanBase64(base64String);
      if (imgData) {
        parts.push({
          inlineData: {
            mimeType: imgData.mimeType,
            data: imgData.data
          }
        });
        
        // Add context for which question this image belongs to
        const qText = QUESTIONS.find(q => q.id === qId)?.text || "Pregunta desconocida";
        parts.push({ text: `[Imagen adjunta para la pregunta: "${qText}"]` });
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Puntaje general de la tienda de 0 a 100 basado en la calidad observada." },
            summary: { type: Type.STRING, description: "Resumen ejecutivo corto del estado de la tienda." },
            criticalIssues: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de problemas críticos detectados que requieren atención inmediata."
            },
            recommendations: {
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de acciones recomendadas para mejorar el puntaje."
            }
          },
          required: ["score", "summary", "criticalIssues", "recommendations"]
        }
      }
    });

    let resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    // Robust parsing
    const start = resultText.indexOf('{');
    const end = resultText.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
        resultText = resultText.substring(start, end + 1);
    }

    return JSON.parse(resultText) as AuditReport;

  } catch (error) {
    console.error("Error generating audit analysis:", error);
    throw error;
  }
};
