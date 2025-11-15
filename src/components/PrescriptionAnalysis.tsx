import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Brain,
  Shield,
  Pill,
  Activity,
  AlertCircle
} from "lucide-react";
import { PrescriptionAnalysis as AnalysisType } from "@/services/prescriptionAgent";

interface PrescriptionAnalysisProps {
  analysis: AnalysisType | null;
  isLoading: boolean;
}

export function PrescriptionAnalysis({ analysis, isLoading }: PrescriptionAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-lg font-semibold">Analizando prescripción con IA...</p>
              <p className="text-sm text-muted-foreground">
                El agente Gemini está evaluando la seguridad y eficacia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getStatusConfig = () => {
    switch (analysis.status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-600',
          label: '✅ Prescripción Aprobada',
          badgeVariant: 'default' as const
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-600',
          label: '⚠️ Requiere Atención',
          badgeVariant: 'secondary' as const
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-600',
          label: '❌ Prescripción Rechazada',
          badgeVariant: 'destructive' as const
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Header con estado general */}
      <Card className={`border-2 ${config.borderColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Análisis del Agente AI (Google Gemini)
            </CardTitle>
            <Badge variant={config.badgeVariant} className="text-sm py-1 px-3">
              Score: {analysis.overallScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`flex items-start gap-4 p-4 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`h-8 w-8 ${config.color} flex-shrink-0 mt-1`} />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${config.color} mb-2`}>
                {config.label}
              </h3>
              <p className="text-sm text-gray-700">{analysis.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas críticas */}
      {analysis.criticalAlerts && analysis.criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Alertas Críticas - Atención Inmediata Requerida</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {analysis.criticalAlerts.map((alert, index) => (
                <li key={index} className="font-semibold">{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Hallazgos detallados */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alergias */}
        <Card className={!analysis.findings.allergies.safe ? 'border-red-300 border-2' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alergias
              {analysis.findings.allergies.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">✓ Seguro</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto">⚠ Riesgo</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.findings.allergies.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-600">🚨 Problemas Detectados:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-red-50 p-2 rounded">
                  {analysis.findings.allergies.issues.map((issue, i) => (
                    <li key={i} className="text-red-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.allergies.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600">💡 Sugerencias:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-blue-50 p-2 rounded">
                  {analysis.findings.allergies.suggestions.map((sugg, i) => (
                    <li key={i} className="text-blue-700">{sugg}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.allergies.safe && analysis.findings.allergies.issues.length === 0 && (
              <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                ✓ No se detectaron conflictos con alergias conocidas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Interacciones */}
        <Card className={!analysis.findings.interactions.safe ? 'border-red-300 border-2' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Interacciones Medicamentosas
              {analysis.findings.interactions.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">✓ Seguro</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto">⚠ Riesgo</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.findings.interactions.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-600">🚨 Interacciones Detectadas:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-red-50 p-2 rounded">
                  {analysis.findings.interactions.issues.map((issue, i) => (
                    <li key={i} className="text-red-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.interactions.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600">💡 Recomendaciones:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-blue-50 p-2 rounded">
                  {analysis.findings.interactions.suggestions.map((sugg, i) => (
                    <li key={i} className="text-blue-700">{sugg}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.interactions.safe && analysis.findings.interactions.issues.length === 0 && (
              <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                ✓ No se detectaron interacciones medicamentosas significativas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dosificación */}
        <Card className={!analysis.findings.dosage.appropriate ? 'border-yellow-300 border-2' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dosificación
              {analysis.findings.dosage.appropriate ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">✓ Apropiada</Badge>
              ) : (
                <Badge variant="secondary" className="ml-auto">⚠ Revisar</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.findings.dosage.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-600">⚠️ Observaciones:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-yellow-50 p-2 rounded">
                  {analysis.findings.dosage.issues.map((issue, i) => (
                    <li key={i} className="text-yellow-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.dosage.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600">💡 Ajustes Sugeridos:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-blue-50 p-2 rounded">
                  {analysis.findings.dosage.suggestions.map((sugg, i) => (
                    <li key={i} className="text-blue-700">{sugg}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.dosage.appropriate && analysis.findings.dosage.issues.length === 0 && (
              <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                ✓ Las dosis son apropiadas para el peso y edad del paciente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contraindicaciones */}
        <Card className={!analysis.findings.contraindications.safe ? 'border-red-300 border-2' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Contraindicaciones
              {analysis.findings.contraindications.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">✓ Ninguna</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto">⚠ Detectadas</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.findings.contraindications.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-600">🚨 Contraindicaciones:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-red-50 p-2 rounded">
                  {analysis.findings.contraindications.issues.map((issue, i) => (
                    <li key={i} className="text-red-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.contraindications.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600">💡 Alternativas:</p>
                <ul className="text-sm list-disc list-inside space-y-1 bg-blue-50 p-2 rounded">
                  {analysis.findings.contraindications.suggestions.map((sugg, i) => (
                    <li key={i} className="text-blue-700">{sugg}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.findings.contraindications.safe && analysis.findings.contraindications.issues.length === 0 && (
              <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                ✓ No se encontraron contraindicaciones con el historial médico
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones generales */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">📋 Recomendaciones Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span className="text-sm text-blue-900">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

