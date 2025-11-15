import OpenAI from 'openai';
import { PrescriptionAnalysis } from './prescriptionAgent';

export interface ComparisonResult {
  needsHumanReview: boolean;
  scoreDifference: number;
  discrepancies: {
    status: {
      gemini: string;
      openai: string;
      conflict: boolean;
    };
    allergies: {
      conflict: boolean;
      differences: string[];
    };
    interactions: {
      conflict: boolean;
      differences: string[];
    };
    dosage: {
      conflict: boolean;
      differences: string[];
    };
    contraindications: {
      conflict: boolean;
      differences: string[];
    };
  };
  finalRecommendation: string;
  comparisonSummary: string;
  agreement: 'high' | 'medium' | 'low'; // Alto, medio o bajo acuerdo entre agentes
}

const getOpenAIApiKey = (): string => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'API Key de OpenAI no configurada. Por favor, configura VITE_OPENAI_API_KEY en tu archivo .env.local'
    );
  }
  return apiKey;
};

/**
 * Detecta si hay conflicto total en la evaluación de status.
 * Conflicto total = uno aprueba y el otro rechaza completamente.
 * @param status1 Status del primer agente ('approved' | 'warning' | 'rejected')
 * @param status2 Status del segundo agente ('approved' | 'warning' | 'rejected')
 * @returns true si hay conflicto total (uno aprueba y el otro rechaza)
 */
function hasTotalStatusConflict(
  status1: 'approved' | 'warning' | 'rejected',
  status2: 'approved' | 'warning' | 'rejected'
): boolean {
  // Conflicto total: uno aprueba y el otro rechaza completamente
  return (
    (status1 === 'approved' && status2 === 'rejected') ||
    (status1 === 'rejected' && status2 === 'approved')
  );
}

export async function compareAnalyses(
  geminiAnalysis: PrescriptionAnalysis,
  openaiAnalysis: PrescriptionAnalysis,
  prescriptionData: any
): Promise<ComparisonResult> {
  
  try {
    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    console.log('🔍 Comparando análisis de Gemini y ChatGPT...');
    
    // Calcular diferencia de scores
    const scoreDifference = Math.abs(geminiAnalysis.overallScore - openaiAnalysis.overallScore);
    
    // Prompt para el agente comparador
    const systemPrompt = `Eres un supervisor médico experto que compara análisis de prescripciones realizados por dos sistemas de IA independientes.

Tu tarea es:
1. Identificar discrepancias significativas entre ambos análisis
2. Evaluar si las diferencias son críticas y requieren revisión humana
3. Proporcionar una recomendación final consolidada

Criterios para marcar "needsHumanReview: true":
- SOLO cuando hay conflicto total en la evaluación: un agente aprueba (approved) y el otro rechaza completamente (rejected)
- NO marcar como crítico solo por diferencia de score si ambos están de acuerdo en aprobar o rechazar

Responde ÚNICAMENTE en español y SOLO con JSON válido.`;

    const userPrompt = `Compara estos dos análisis de la misma prescripción:

PRESCRIPCIÓN ANALIZADA:
- Diagnóstico: ${prescriptionData.diagnosis}
- Medicamentos: ${prescriptionData.medications.map((m: any) => `${m.name} ${m.dose}${m.unit}`).join(', ')}

ANÁLISIS DE GEMINI:
- Status: ${geminiAnalysis.status}
- Score: ${geminiAnalysis.overallScore}/100
- Alergias seguras: ${geminiAnalysis.findings.allergies.safe ? 'Sí' : 'No'}
- Interacciones seguras: ${geminiAnalysis.findings.interactions.safe ? 'Sí' : 'No'}
- Dosis apropiada: ${geminiAnalysis.findings.dosage.appropriate ? 'Sí' : 'No'}
- Contraindicaciones seguras: ${geminiAnalysis.findings.contraindications.safe ? 'Sí' : 'No'}
- Resumen: ${geminiAnalysis.summary}
- Alertas críticas: ${geminiAnalysis.criticalAlerts.length > 0 ? geminiAnalysis.criticalAlerts.join(', ') : 'Ninguna'}

ANÁLISIS DE CHATGPT:
- Status: ${openaiAnalysis.status}
- Score: ${openaiAnalysis.overallScore}/100
- Alergias seguras: ${openaiAnalysis.findings.allergies.safe ? 'Sí' : 'No'}
- Interacciones seguras: ${openaiAnalysis.findings.interactions.safe ? 'Sí' : 'No'}
- Dosis apropiada: ${openaiAnalysis.findings.dosage.appropriate ? 'Sí' : 'No'}
- Contraindicaciones seguras: ${openaiAnalysis.findings.contraindications.safe ? 'Sí' : 'No'}
- Resumen: ${openaiAnalysis.summary}
- Alertas críticas: ${openaiAnalysis.criticalAlerts.length > 0 ? openaiAnalysis.criticalAlerts.join(', ') : 'Ninguna'}

DIFERENCIA DE SCORES: ${scoreDifference} puntos

Analiza y responde con este JSON exacto (en español):
{
  "needsHumanReview": true/false,
  "agreement": "high|medium|low",
  "discrepancies": {
    "status": {
      "conflict": true/false,
      "differences": ["explicación de diferencias en status"]
    },
    "allergies": {
      "conflict": true/false,
      "differences": ["diferencias encontradas en análisis de alergias"]
    },
    "interactions": {
      "conflict": true/false,
      "differences": ["diferencias en interacciones medicamentosas"]
    },
    "dosage": {
      "conflict": true/false,
      "differences": ["diferencias en evaluación de dosis"]
    },
    "contraindications": {
      "conflict": true/false,
      "differences": ["diferencias en contraindicaciones"]
    }
  },
  "finalRecommendation": "Recomendación consolidada final en español basada en ambos análisis",
  "comparisonSummary": "Resumen de la comparación explicando nivel de acuerdo y principales discrepancias"
}`;

    console.log('📝 Enviando datos de comparación a ChatGPT...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2, // Más determinístico para comparación
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No se recibió respuesta del agente comparador');
    }
    
    console.log('✅ Comparación completada');
    console.log('📄 Resultado:', responseText);
    
    const comparisonData = JSON.parse(responseText);

    // Detectar conflicto total en status
    const totalConflict = hasTotalStatusConflict(geminiAnalysis.status, openaiAnalysis.status);
    
    // Construir resultado final con estructura completa
    const result: ComparisonResult = {
      needsHumanReview: totalConflict || comparisonData.needsHumanReview === true,
      scoreDifference,
      agreement: comparisonData.agreement || 'medium',
      discrepancies: {
        status: {
          gemini: geminiAnalysis.status,
          openai: openaiAnalysis.status,
          conflict: comparisonData.discrepancies?.status?.conflict || geminiAnalysis.status !== openaiAnalysis.status
        },
        allergies: {
          conflict: comparisonData.discrepancies?.allergies?.conflict || false,
          differences: comparisonData.discrepancies?.allergies?.differences || []
        },
        interactions: {
          conflict: comparisonData.discrepancies?.interactions?.conflict || false,
          differences: comparisonData.discrepancies?.interactions?.differences || []
        },
        dosage: {
          conflict: comparisonData.discrepancies?.dosage?.conflict || false,
          differences: comparisonData.discrepancies?.dosage?.differences || []
        },
        contraindications: {
          conflict: comparisonData.discrepancies?.contraindications?.conflict || false,
          differences: comparisonData.discrepancies?.contraindications?.differences || []
        }
      },
      finalRecommendation: comparisonData.finalRecommendation || 'Se requiere revisión de ambos análisis',
      comparisonSummary: comparisonData.comparisonSummary || `Los análisis difieren en ${scoreDifference} puntos. ${scoreDifference > 20 ? 'Se recomienda revisión humana.' : 'Diferencia aceptable.'}`
    };

    console.log('🎯 Necesita revisión humana:', result.needsHumanReview);
    console.log('📊 Diferencia de score:', result.scoreDifference);
    console.log('🤝 Nivel de acuerdo:', result.agreement);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Error comparing analyses:', error);
    
    // En caso de error, hacer una comparación básica sin IA
    const scoreDifference = Math.abs(geminiAnalysis.overallScore - openaiAnalysis.overallScore);
    const totalConflict = hasTotalStatusConflict(geminiAnalysis.status, openaiAnalysis.status);
    const statusConflict = geminiAnalysis.status !== openaiAnalysis.status;
    
    return {
      needsHumanReview: totalConflict, // Solo conflicto total requiere revisión humana
      scoreDifference,
      agreement: totalConflict ? 'low' : scoreDifference > 20 ? 'medium' : scoreDifference > 10 ? 'medium' : 'high',
      discrepancies: {
        status: {
          gemini: geminiAnalysis.status,
          openai: openaiAnalysis.status,
          conflict: statusConflict
        },
        allergies: {
          conflict: geminiAnalysis.findings.allergies.safe !== openaiAnalysis.findings.allergies.safe,
          differences: ['Error en análisis de comparación automática']
        },
        interactions: {
          conflict: geminiAnalysis.findings.interactions.safe !== openaiAnalysis.findings.interactions.safe,
          differences: ['Error en análisis de comparación automática']
        },
        dosage: {
          conflict: geminiAnalysis.findings.dosage.appropriate !== openaiAnalysis.findings.dosage.appropriate,
          differences: ['Error en análisis de comparación automática']
        },
        contraindications: {
          conflict: geminiAnalysis.findings.contraindications.safe !== openaiAnalysis.findings.contraindications.safe,
          differences: ['Error en análisis de comparación automática']
        }
      },
      finalRecommendation: 'Error al comparar análisis. Se recomienda revisión manual de ambos resultados.',
      comparisonSummary: `No se pudo completar la comparación automática. Diferencia de score: ${scoreDifference} puntos.`
    };
  }
}

