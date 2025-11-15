# 🧪 Guía de Pruebas - Sistema Multi-Agente

## 🚀 Inicio Rápido

### 1. Verificar Configuración

```bash
# Asegúrate de que las API keys estén configuradas
cat .env.local
```

Deberías ver:
```
VITE_GEMINI_API_KEY=tu_key_de_gemini
VITE_OPENAI_API_KEY=sk-proj-9jgblbVqByn38C3z...
```

### 2. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`

## 📝 Casos de Prueba

### ✅ CASO 1: Prescripción Segura (Alto Acuerdo Esperado)

**Objetivo**: Verificar que ambos agentes aprueban prescripciones seguras

**Pasos**:
1. Seleccionar paciente: **María García** (PAT-001)
2. Diagnóstico: `Hipertensión arterial leve controlada`
3. Agregar medicamento:
   - Nombre: `Losartán`
   - Vía: `Oral`
   - Dosis: `50`
   - Unidad: `mg`
   - Frecuencia: `24` horas
4. Click en "Analizar y Guardar Prescripción"

**Resultado Esperado**:
- ✅ Toast: "Ambos agentes coinciden - Alto nivel de confianza"
- Score Gemini: 85-95
- Score ChatGPT: 85-95
- Diferencia: < 10 puntos
- Badge: "Alto Acuerdo"
- Botón verde: "Confirmar y Guardar"

---

### ⚠️ CASO 2: Prescripción con Advertencias (Acuerdo Moderado)

**Objetivo**: Verificar detección de advertencias con acuerdo moderado

**Pasos**:
1. Seleccionar paciente: **Carlos Rodríguez** (PAT-002)
2. Diagnóstico: `Diabetes tipo 2 descompensada`
3. Agregar medicamento:
   - Nombre: `Metformina`
   - Vía: `Oral`
   - Dosis: `1000`
   - Unidad: `mg`
   - Frecuencia: `8` horas
4. Click en "Analizar y Guardar Prescripción"

**Resultado Esperado**:
- ⚠️ Toast: "Acuerdo moderado entre agentes - Revisar diferencias"
- Score Gemini: 70-80
- Score ChatGPT: 65-75
- Diferencia: 10-15 puntos
- Badge: "Acuerdo Moderado"
- Posibles advertencias sobre dosis alta
- Botón amarillo: "Aceptar con Advertencias"

---

### ❌ CASO 3: Alergia Crítica (Rechazo por Ambos Agentes)

**Objetivo**: Verificar detección de alergias críticas

**Pasos**:
1. Seleccionar paciente: **María García** (PAT-001)
   - ⚠️ **Nota**: Tiene alergia severa a Penicilina
2. Diagnóstico: `Infección de vías respiratorias superiores`
3. Agregar medicamento:
   - Nombre: `Amoxicilina`
   - Vía: `Oral`
   - Dosis: `500`
   - Unidad: `mg`
   - Frecuencia: `8` horas
4. Click en "Analizar y Guardar Prescripción"

**Resultado Esperado**:
- ❌ **ALERTA ROJA**: "SE REQUIERE REVISIÓN HUMANA"
- Ambos agentes rechazan (status: "rejected")
- Score bajo (< 40 para ambos)
- **Alertas críticas**: Alergia a Penicilina detectada
- Discrepancias mínimas (ambos coinciden en rechazo)
- Botón rojo: "Enviar a Revisión Humana"
- Sugerencia de antibiótico alternativo (ej: Azitromicina)

---

### 🔍 CASO 4: Discrepancia Alta (Requiere Revisión Humana)

**Objetivo**: Verificar detección de discrepancias > 20 puntos

**Pasos**:
1. Seleccionar paciente: **Laura Martínez** (PAT-004)
   - Nota: Paciente con múltiples condiciones y medicamentos activos
2. Diagnóstico: `Diabetes tipo 2 + Hipertensión + Insuficiencia renal leve`
3. Agregar medicamentos:
   - Medicamento 1:
     - Nombre: `Insulina`
     - Vía: `Subcutánea`
     - Dosis: `20`
     - Unidad: `UI`
     - Frecuencia: `12` horas
   - Medicamento 2:
     - Nombre: `Enalapril`
     - Vía: `Oral`
     - Dosis: `20`
     - Unidad: `mg`
     - Frecuencia: `12` horas
   - Medicamento 3:
     - Nombre: `Metformina`
     - Vía: `Oral`
     - Dosis: `850`
     - Unidad: `mg`
     - Frecuencia: `12` horas
4. Click en "Analizar y Guardar Prescripción"

**Resultado Esperado**:
- ⚠️ **BANNER ROJO**: "SE REQUIERE REVISIÓN HUMANA INMEDIATA"
- Posible diferencia > 20 puntos entre agentes
- Badge: "Bajo Acuerdo" o "Acuerdo Moderado"
- Discrepancias resaltadas:
  - Posible conflicto en interacciones medicamentosas
  - Metformina + Insuficiencia renal (un agente puede ser más conservador)
  - Ajuste de dosis por función renal
- Sección "Discrepancias Detectadas" visible con explicaciones
- Botón: "Enviar a Revisión Humana"

---

### 🎯 CASO 5: Dosis Excesiva (Ambos Rechazan pero con Diferente Severidad)

**Objetivo**: Verificar detección de dosis peligrosas

**Pasos**:
1. Seleccionar paciente: **Sofía López** (PAT-005)
   - Edad: ~12 años (paciente pediátrico)
2. Diagnóstico: `Fiebre e inflamación leve`
3. Agregar medicamento:
   - Nombre: `Ibuprofeno`
   - Vía: `Oral`
   - Dosis: `800`
   - Unidad: `mg`
   - Frecuencia: `6` horas
4. Click en "Analizar y Guardar Prescripción"

**Resultado Esperado**:
- ❌ Ambos agentes rechazan o advierten severamente
- Alertas sobre dosis pediátrica excesiva
- Sugerencia: Reducir a 200-400mg según peso
- Cálculo incorrecto para edad/peso
- Diferencia moderada en scores (ambos bajos pero uno más crítico)

---

## 🔍 Qué Verificar en Cada Prueba

### En la Consola del Navegador (F12)

Deberías ver logs como:
```
🚀 Iniciando análisis multi-agente...
🤖 Analizando prescripción con Gemini...
🤖 Analizando prescripción con ChatGPT (OpenAI)...
✅ Respuesta recibida de Gemini
✅ Respuesta recibida de ChatGPT
✅ Ambos agentes completaron su análisis
🔍 Comparando análisis de Gemini y ChatGPT...
✅ Comparación completada
🎯 Necesita revisión humana: true/false
📊 Diferencia de score: X puntos
🤝 Nivel de acuerdo: high/medium/low
```

### En la Interfaz

1. **Spinner de Carga**: Debe mostrar las 3 etapas
   - ⏳ Gemini está evaluando...
   - ⏳ ChatGPT está realizando análisis...
   - ⏳ Comparando resultados...

2. **Resultado de Comparación**:
   - Diferencia de scores clara
   - Badge de nivel de acuerdo
   - Resumen de comparación en español
   - Recomendación final consolidada

3. **Banner de Revisión** (si aplica):
   - Solo aparece cuando `needsHumanReview: true`
   - Explica por qué se requiere revisión

4. **Discrepancias**:
   - Solo visibles cuando hay conflictos
   - Código de colores correcto
   - Explicaciones en español

5. **Tabs de Análisis Detallados**:
   - Tab "Gemini" con score
   - Tab "ChatGPT" con score
   - Contenido completo en cada tab

6. **Botones de Acción**:
   - Verde: Solo si ambos aprueban y no hay revisión humana
   - Amarillo: Si hay advertencias pero acuerdo aceptable
   - Rojo: Si requiere revisión humana
   - Gris outline: Corregir/Modificar

---

## 🐛 Solución de Problemas

### Error: "API Key no configurada"

```bash
# Verifica que el archivo .env.local existe
ls -la .env.local

# Verifica el contenido (sin mostrar las keys completas)
cat .env.local | grep VITE_
```

### Error: "Límite de cuota"

- **Gemini**: Crea una nueva API key en Google AI Studio
- **OpenAI**: Verifica tu saldo en platform.openai.com

### Error: "404 modelo no encontrado"

- **Gemini**: Verifica que tienes acceso a `gemini-2.5-flash`
- **OpenAI**: El modelo `gpt-3.5-turbo` debería estar siempre disponible

### Análisis muy lento (> 30 segundos)

- Verifica tu conexión a internet
- Revisa la consola por errores de timeout
- Los análisis paralelos deberían completarse en 5-11 segundos

### Discrepancias no se muestran correctamente

- Abre la consola (F12) y busca errores
- Verifica que `comparisonResult` tenga datos
- Revisa que `discrepancies` contenga las diferencias

---

## 📊 Matriz de Resultados Esperados

| Caso | Gemini Score | ChatGPT Score | Diferencia | Acuerdo | Revisión Humana |
|------|-------------|---------------|------------|---------|-----------------|
| 1    | 85-95       | 85-95         | < 10       | Alto    | ❌ No           |
| 2    | 70-80       | 65-75         | 10-15      | Moderado| ❌ No           |
| 3    | < 40        | < 40          | < 10       | Alto*   | ⚠️ Sí (crítico)|
| 4    | 60-75       | 35-50         | > 20       | Bajo    | ✅ Sí           |
| 5    | < 50        | < 50          | 5-15       | Alto*   | ⚠️ Sí (crítico)|

*Alto acuerdo en rechazo = ambos coinciden que es peligroso

---

## ✅ Checklist de Validación

- [ ] Ambos agentes se ejecutan en paralelo (< 10 seg total)
- [ ] Los scores se muestran correctamente para cada agente
- [ ] La diferencia de scores se calcula bien
- [ ] El badge de acuerdo refleja la diferencia real
- [ ] El banner de revisión humana aparece cuando debe (> 20 pts)
- [ ] Las discrepancias se listan correctamente
- [ ] Los colores de discrepancias son apropiados (rojo/naranja/amarillo)
- [ ] Los tabs funcionan y muestran análisis completos
- [ ] Los botones de acción cambian según el resultado
- [ ] Los toasts informativos son claros y útiles
- [ ] Todos los textos están en español
- [ ] No hay errores en la consola
- [ ] El formulario se puede limpiar correctamente

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12)
2. Verifica los logs del servidor
3. Comprueba que ambas API keys sean válidas
4. Intenta con casos más simples primero
5. Verifica que tienes créditos en ambas plataformas

---

**¡Feliz Testing! 🎉**

