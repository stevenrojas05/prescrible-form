# ⚙️ Configuración del Proyecto

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o bun
- Cuenta de Google (para API Key gratuita)

## 🚀 Instalación

### 1. Clonar e Instalar Dependencias

```bash
git clone <tu-repo-url>
cd prescrible-form
npm install
```

### 2. Configurar API Key de Google Gemini (GRATIS)

#### Obtener API Key:

1. Ve a **https://aistudio.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Create API Key"**
4. **IMPORTANTE:** Selecciona **"Create API key in new project"**
5. Copia la API Key generada

#### Configurar en el Proyecto:

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

**Ejemplo:**
```env
VITE_GEMINI_API_KEY=AIzaSyDEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

### 3. Ejecutar el Proyecto

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador

## ✅ Verificar Configuración

1. Abre la aplicación
2. Presiona **F12** (DevTools)
3. Ve a la pestaña **Console**
4. Crea una prescripción de prueba
5. Deberías ver en consola:
   ```
   🔍 Verificando modelos disponibles...
   ✅ Modelos disponibles: [...]
   ✅ Usando modelo: models/gemini-1.5-flash-latest
   ```

## 🆘 Solución de Problemas

### Error: "API Key de Gemini no configurada"
- Verifica que el archivo `.env.local` existe
- Verifica que la variable se llama `VITE_GEMINI_API_KEY`
- Reinicia el servidor (Ctrl+C → npm run dev)

### Error: "No se encontraron modelos disponibles"
- Tu API Key no tiene permisos
- Solución: Crea una nueva API Key seleccionando **"Create API key in new project"**

### El análisis no funciona
1. Abre la consola del navegador (F12)
2. Revisa los errores
3. Verifica que la API Key esté correctamente configurada
4. Asegúrate de haber reiniciado el servidor

## 📊 Límites del Tier Gratuito

| Característica | Límite (Gemini 1.5 Flash) |
|----------------|----------------------------|
| Requests por minuto | 15 RPM |
| Requests por día | 1,500 RPD |
| Tokens por request | 2,048 (optimizado) |
| Costo | **$0 (GRATIS)** |
| Tarjeta requerida | **NO** |

**Nota:** El sistema está optimizado para consumir mínimos tokens y evitar errores de cuota.

## 🎯 Próximos Pasos

Una vez configurado:
1. Lee el [README.md](./README.md) para entender el proyecto
2. Prueba creando prescripciones
3. Revisa el código en `src/services/prescriptionAgent.ts`

## 💡 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas tu API Key públicamente
- ⚠️ **NUNCA** subas `.env.local` a GitHub (ya está en `.gitignore`)
- ✅ Para producción, usa variables de entorno del servidor

---

¿Problemas con la configuración? Revisa la consola del navegador (F12) y busca errores específicos.

