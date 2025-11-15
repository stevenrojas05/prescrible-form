import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PrescriptionAnalysis {
  status: 'approved' | 'warning' | 'rejected';
  overallScore: number; // 0-100
  findings: {
    allergies: {
      safe: boolean;
      issues: string[];
      suggestions: string[];
    };
    interactions: {
      safe: boolean;
      issues: string[];
      suggestions: string[];
    };
    dosage: {
      appropriate: boolean;
      issues: string[];
      suggestions: string[];
    };
    contraindications: {
      safe: boolean;
      issues: string[];
      suggestions: string[];
    };
  };
  summary: string;
  recommendations: string[];
  criticalAlerts: string[];
  timestamp: string;
}

const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'API Key de Gemini no configurada. Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env.local'
    );
  }
  return apiKey;
};

export async function analyzePrescription(
  prescriptionData: any,
  patientData: any
): Promise<PrescriptionAnalysis> {
  
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('🤖 Analizando prescripción con Gemini...');
    
    // Construir prompt conciso en español
    const prompt = `Eres un farmacólogo clínico experto. Analiza esta prescripción médica.

PACIENTE:
- Nombre: ${patientData.nombre} ${patientData.apellido}
- Edad: ${new Date().getFullYear() - new Date(patientData.fecha_nacimiento).getFullYear()} años
- Peso: ${patientData.peso_kg}kg
- Alergias: ${patientData.alergias.map((a: any) => a.alergeno).join(', ')}
- Medicamentos actuales: ${patientData.medicamentos_recetados_anteriores.filter((m: any) => m.estatus === 'activo').map((m: any) => m.nombre_generico).join(', ') || 'Ninguno'}

PRESCRIPCIÓN:
- Diagnóstico: ${prescriptionData.diagnosis}
- Medicamentos: ${prescriptionData.medications.map((m: any) => `${m.name} ${m.dose}${m.unit} ${m.route}`).join(', ')}

INSTRUCCIONES IMPORTANTES:
- Responde ÚNICAMENTE en español
- Evalúa: alergias, interacciones medicamentosas, dosis apropiadas, contraindicaciones
- Clasifica como: "approved" (seguro), "warning" (precaución), o "rejected" (peligroso)
- Todos los textos deben estar en español

Responde SOLO con este JSON (textos en español):
{
  "status": "approved|warning|rejected",
  "overallScore": 85,
  "findings": {
    "allergies": {
      "safe": true,
      "issues": ["texto en español si hay problemas"],
      "suggestions": ["texto en español con sugerencias"]
    },
    "interactions": {
      "safe": true,
      "issues": ["texto en español"],
      "suggestions": ["texto en español"]
    },
    "dosage": {
      "appropriate": true,
      "issues": ["texto en español"],
      "suggestions": ["texto en español"]
    },
    "contraindications": {
      "safe": true,
      "issues": ["texto en español"],
      "suggestions": ["texto en español"]
    }
  },
  "summary": "Resumen en español de 2-3 líneas",
  "recommendations": ["recomendaciones en español"],
  "criticalAlerts": ["alertas críticas en español"]
}`;

    console.log('📝 Prompt enviado:', prompt);

    // Usar modelo correcto y tokens suficientes
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 4096,
      }
    });
    
    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();
    
    console.log('✅ Respuesta recibida de Gemini');
    console.log('📄 Respuesta completa:', text);
    console.log('📊 Metadata:', result.response.usageMetadata);
    
    // Limpiar la respuesta por si viene con markdown
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(cleanedText);

    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error('❌ Error analyzing prescription:', error);
    
    // Manejo de errores específicos
    if (error.message?.includes('API Key')) {
      throw new Error('API Key de Gemini no configurada o inválida. Por favor verifica tu configuración.');
    }
    
    if (error.message?.includes('quota')) {
      throw new Error('Límite de cuota alcanzado. Por favor intenta más tarde.');
    }
    
    throw new Error(`Error al analizar la prescripción: ${error.message}`);
  }
}

// Función auxiliar para calcular edad
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

