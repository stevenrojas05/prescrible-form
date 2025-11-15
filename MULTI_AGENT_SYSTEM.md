# Sistema Multi-Agente para Análisis de Prescripciones

## 📋 Descripción General

Este sistema implementa un enfoque de **triple validación con IA** para analizar prescripciones médicas:

1. **Agente 1 (Gemini)**: Analiza la prescripción de forma independiente
2. **Agente 2 (ChatGPT)**: Realiza un análisis paralelo e independiente
3. **Agente 3 (Comparador ChatGPT)**: Compara ambos análisis y detecta discrepancias

## 🎯 Objetivo

Aumentar la confiabilidad del análisis mediante validación cruzada de múltiples modelos de IA, detectando automáticamente cuando hay desacuerdos significativos que requieren revisión humana.

## 🏗️ Arquitectura

```
Usuario envía prescripción
         │
         ▼
┌────────────────────────────┐
│  Ejecución en PARALELO     │
├────────────┬───────────────┤
│   Gemini   │   ChatGPT     │
│  (Agente 1)│  (Agente 2)   │
└─────┬──────┴───────┬───────┘
      │              │
      └──────┬───────┘
             ▼
    ┌────────────────────┐
    │ Agente Comparador  │
    │   (ChatGPT)        │
    └─────────┬──────────┘
              ▼
    ┌─────────────────────┐
    │ Resultado Final con │
    │ Nivel de Confianza  │
    └─────────────────────┘
```

## 🔧 Configuración

### 1. Variables de Entorno

Asegúrate de tener ambas API keys configuradas en `.env.local`:

```bash
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
VITE_OPENAI_API_KEY=tu_api_key_de_openai
```

### 2. Modelos Utilizados

- **Gemini**: `gemini-2.5-flash` (optimizado para velocidad y precisión)
- **ChatGPT Análisis**: `gpt-3.5-turbo` (análisis independiente)
- **ChatGPT Comparador**: `gpt-3.5-turbo` (comparación y síntesis)

## 🚦 Criterios de Discrepancia

El sistema marca **"Requiere Revisión Humana"** cuando:

1. **Diferencia de Score > 20 puntos**
2. **Conflicto en Status**: Uno aprueba y otro rechaza
3. **Hallazgos Críticos Contradictorios**: Especialmente en alergias e interacciones

## 📊 Niveles de Acuerdo

### Alto Acuerdo (High)
- Diferencia de score < 10 puntos
- Ambos agentes coinciden en el status
- Sin conflictos en áreas críticas
- **Acción**: Proceder con confianza

### Acuerdo Moderado (Medium)
- Diferencia de score 10-20 puntos
- Pequeñas diferencias en evaluaciones secundarias
- **Acción**: Revisar diferencias antes de proceder

### Bajo Acuerdo (Low)
- Diferencia de score > 20 puntos
- Conflictos en evaluaciones principales
- **Acción**: Revisión humana obligatoria

## 🧪 Casos de Prueba

### Caso 1: Alto Acuerdo - Prescripción Segura
**Paciente**: María García (PAT-001)
**Diagnóstico**: Hipertensión arterial leve
**Medicamento**: Losartán 50mg oral
**Resultado Esperado**: 
- Ambos agentes aprueban
- Score similar (85-95)
- Alto acuerdo

### Caso 2: Discrepancia Moderada - Dosis Límite
**Paciente**: Carlos Rodríguez (PAT-002)
**Diagnóstico**: Infección respiratoria
**Medicamento**: Amoxicilina 1000mg oral cada 8 horas
**Resultado Esperado**:
- Un agente puede sugerir dosis menor
- Diferencia de score 10-15 puntos
- Acuerdo moderado

### Caso 3: Discrepancia Alta - Alergia Crítica
**Paciente**: María García (PAT-001) - alérgica a Penicilina
**Diagnóstico**: Infección bacteriana
**Medicamento**: Amoxicilina 500mg
**Resultado Esperado**:
- Ambos agentes rechazan
- Alertas críticas sobre alergia
- Requiere corrección inmediata

### Caso 4: Revisión Humana - Interacción Compleja
**Paciente**: Laura Martínez (PAT-004) - múltiples medicamentos
**Diagnóstico**: Diabetes + Hipertensión
**Medicamentos**: Insulina + Metformina + Enalapril
**Resultado Esperado**:
- Posible desacuerdo en interacciones
- Diferencia > 20 puntos
- Banner "Requiere Revisión Humana"

## 💻 Flujo de Uso

1. **Seleccionar Paciente**: Elegir del dropdown
2. **Ingresar Diagnóstico**: Descripción clara del caso
3. **Agregar Medicamentos**: Con dosis, vía y frecuencia
4. **Analizar**: Click en "Analizar y Guardar Prescripción"
5. **Esperar Análisis**:
   - ⏳ Gemini analiza (~3-5 segundos)
   - ⏳ ChatGPT analiza en paralelo (~3-5 segundos)
   - ⏳ Comparación final (~2-3 segundos)
6. **Revisar Resultados**:
   - Ver resumen de comparación
   - Revisar discrepancias si existen
   - Comparar análisis detallados en tabs
7. **Tomar Decisión**:
   - ✅ Confirmar si hay alto acuerdo
   - ⚠️ Aceptar con advertencias si acuerdo moderado
   - ❌ Corregir si hay rechazo
   - 🔍 Enviar a revisión humana si hay discrepancia alta

## 📈 Interfaz de Usuario

### Panel de Comparación

```
┌─────────────────────────────────────────────────┐
│  ⚠️ SE REQUIERE REVISIÓN HUMANA                 │
│  Discrepancias significativas detectadas (25pt) │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔍 Resultado de la Comparación Multi-Agente    │
│                                                  │
│ 📊 Diferencia: 25 puntos                        │
│ 🤝 Acuerdo: Bajo                                │
│                                                  │
│ 🎯 Recomendación Final:                         │
│ [Síntesis del agente comparador]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 👁️ Análisis Detallados                          │
│                                                  │
│  [Gemini (Score: 85)] [ChatGPT (Score: 60)]    │
│                                                  │
│  [Tabs con análisis detallados de cada agente] │
└─────────────────────────────────────────────────┘
```

### Discrepancias Visualizadas

- **Rojo**: Conflictos críticos (alergias, contraindicaciones)
- **Naranja**: Diferencias en interacciones
- **Amarillo**: Diferencias en dosificación
- **Verde**: Áreas de acuerdo

## 🔍 Debugging

Los servicios incluyen logs detallados en consola:

```javascript
console.log('🚀 Iniciando análisis multi-agente...');
console.log('✅ Ambos agentes completaron su análisis');
console.log('🔍 Iniciando comparación de resultados...');
console.log('✅ Comparación completada');
console.log('🎯 Necesita revisión humana:', result.needsHumanReview);
console.log('📊 Diferencia de score:', result.scoreDifference);
console.log('🤝 Nivel de acuerdo:', result.agreement);
```

## 📝 Estructura de Respuesta

### Análisis Individual (Gemini/ChatGPT)
```typescript
{
  status: 'approved' | 'warning' | 'rejected',
  overallScore: number,
  findings: {
    allergies: { safe, issues, suggestions },
    interactions: { safe, issues, suggestions },
    dosage: { appropriate, issues, suggestions },
    contraindications: { safe, issues, suggestions }
  },
  summary: string,
  recommendations: string[],
  criticalAlerts: string[],
  timestamp: string
}
```

### Resultado de Comparación
```typescript
{
  needsHumanReview: boolean,
  scoreDifference: number,
  agreement: 'high' | 'medium' | 'low',
  discrepancies: {
    status: { gemini, openai, conflict },
    allergies: { conflict, differences },
    interactions: { conflict, differences },
    dosage: { conflict, differences },
    contraindications: { conflict, differences }
  },
  finalRecommendation: string,
  comparisonSummary: string
}
```

## ⚡ Rendimiento

- **Análisis Paralelo**: 3-7 segundos (Gemini + ChatGPT)
- **Comparación**: 2-4 segundos
- **Total**: ~5-11 segundos por prescripción

## 🛡️ Manejo de Errores

El sistema incluye manejo robusto de errores:

1. **API Key Inválida**: Mensaje claro indicando qué clave falta
2. **Límite de Cuota**: Notificación para intentar más tarde
3. **Timeout**: Fallback a comparación básica sin IA
4. **JSON Inválido**: Parsing defensivo con valores por defecto

## 🎓 Mejores Prácticas

1. **Siempre revisar** las discrepancias mostradas en rojo
2. **No ignorar** el banner de revisión humana
3. **Comparar ambos análisis** cuando hay acuerdo moderado
4. **Documentar decisiones** cuando se aceptan advertencias
5. **Escalar a experto** cuando la diferencia de scores > 30 puntos

## 📚 Archivos del Sistema

```
src/
├── services/
│   ├── prescriptionAgent.ts    # Agente 1: Gemini
│   ├── openaiAgent.ts          # Agente 2: ChatGPT
│   └── comparisonAgent.ts      # Agente 3: Comparador
├── components/
│   ├── PrescriptionForm.tsx    # Orquestador principal
│   ├── ComparisonAnalysis.tsx  # UI de comparación
│   └── PrescriptionAnalysis.tsx # UI individual (legacy)
```

## 🔐 Seguridad

- Las API keys se manejan mediante variables de entorno
- Nunca se exponen en el código cliente
- `dangerouslyAllowBrowser: true` solo en desarrollo
- En producción, usar backend proxy para las APIs

## 🚀 Próximos Pasos

1. Implementar persistencia de análisis comparativos
2. Agregar métricas de concordancia entre agentes
3. Sistema de auditoría para casos de revisión humana
4. Dashboard de estadísticas de discrepancias
5. Entrenamiento continuo basado en feedback médico

---

**Versión**: 1.0.0  
**Última Actualización**: 2025-01-15  
**Modelos**: Gemini 2.5 Flash + GPT-3.5 Turbo

