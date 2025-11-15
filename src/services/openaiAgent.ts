import OpenAI from 'openai';
import { PrescriptionAnalysis } from './prescriptionAgent';

const getOpenAIApiKey = (): string => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'API Key de OpenAI no configurada. Por favor, configura VITE_OPENAI_API_KEY en tu archivo .env.local'
    );
  }
  return apiKey;
};

export async function analyzeWithOpenAI(
  prescriptionData: any,
  patientData: any
): Promise<PrescriptionAnalysis> {
  
  try {
    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Necesario para usar en el navegador
    });
    
    console.log('🤖 Analizando prescripción con ChatGPT (OpenAI)...');
    
    // Construir prompt conciso en español (independiente del de Gemini)
    const systemPrompt = `Eres un farmacólogo clínico experto. Tu tarea es analizar prescripciones médicas y evaluar su seguridad y eficacia.

Debes evaluar:
1. Alergias del paciente vs medicamentos prescritos
2. Interacciones medicamentosas (con medicamentos actuales)
3. Dosis apropiadas para edad y peso del paciente
4. Contraindicaciones

Clasifica la prescripción como:
- "approved" si es completamente segura
- "warning" si requiere precauciones pero es viable
- "rejected" si es peligrosa o tiene errores críticos

Responde ÚNICAMENTE en español y SOLO con JSON válido, sin texto adicional.`;

    const userPrompt = `Analiza esta prescripción médica:

DATOS DEL PACIENTE:
- Nombre: ${patientData.nombre} ${patientData.apellido}
- Edad: ${new Date().getFullYear() - new Date(patientData.fecha_nacimiento).getFullYear()} años
- Peso: ${patientData.peso_kg}kg
- Alergias conocidas: ${patientData.alergias.map((a: any) => a.alergeno).join(', ')}
- Medicamentos en uso actualmente: ${patientData.medicamentos_recetados_anteriores.filter((m: any) => m.estatus === 'activo').map((m: any) => m.nombre_generico).join(', ') || 'Ninguno'}

PRESCRIPCIÓN A EVALUAR:
- Diagnóstico: ${prescriptionData.diagnosis}
- Medicamentos prescritos: ${prescriptionData.medications.map((m: any) => `${m.name} ${m.dose}${m.unit} vía ${m.route}`).join(', ')}

Responde con este formato JSON exacto (todos los textos en español):
{
  "status": "approved|warning|rejected",
  "overallScore": 85,
  "findings": {
    "allergies": {
      "safe": true,
      "issues": ["descripción en español de problemas de alergias"],
      "suggestions": ["sugerencias en español"]
    },
    "interactions": {
      "safe": true,
      "issues": ["descripción en español de interacciones"],
      "suggestions": ["sugerencias en español"]
    },
    "dosage": {
      "appropriate": true,
      "issues": ["descripción en español de problemas de dosis"],
      "suggestions": ["sugerencias en español"]
    },
    "contraindications": {
      "safe": true,
      "issues": ["descripción en español de contraindicaciones"],
      "suggestions": ["sugerencias en español"]
    }
  },
  "summary": "Resumen breve en español de 2-3 líneas",
  "recommendations": ["lista de recomendaciones en español"],
  "criticalAlerts": ["lista de alertas críticas en español si las hay"]
}`;

    console.log('📝 Prompt enviado a OpenAI');

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No se recibió respuesta de OpenAI');
    }
    
    console.log('✅ Respuesta recibida de ChatGPT');
    console.log('📄 Respuesta completa:', responseText);
    console.log('📊 Tokens usados:', completion.usage);
    
    const analysis = JSON.parse(responseText);

    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error('❌ Error analyzing with OpenAI:', error);
    
    // Manejo de errores específicos
    if (error.message?.includes('API Key') || error.message?.includes('Incorrect API key')) {
      throw new Error('API Key de OpenAI no configurada o inválida. Por favor verifica tu configuración.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate_limit')) {
        console.log(error);
      throw new Error('Límite de cuota de OpenAI alcanzado. Por favor intenta más tarde.');
    }
    
    throw new Error(`Error al analizar con ChatGPT: ${error.message}`);
  }
}

