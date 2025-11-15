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
  AlertCircle,
  GitCompare,
  Eye
} from "lucide-react";
import { PrescriptionAnalysis } from "@/services/prescriptionAgent";
import { ComparisonResult } from "@/services/comparisonAgent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComparisonAnalysisProps {
  geminiAnalysis: PrescriptionAnalysis | null;
  openaiAnalysis: PrescriptionAnalysis | null;
  comparisonResult: ComparisonResult | null;
  isLoading: boolean;
}

export function ComparisonAnalysis({ 
  geminiAnalysis, 
  openaiAnalysis, 
  comparisonResult,
  isLoading 
}: ComparisonAnalysisProps) {
  
  if (isLoading) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold">Analizando prescripción con múltiples agentes...</p>
              <p className="text-sm text-muted-foreground mt-1">
                ⏳ Gemini está evaluando la prescripción...
              </p>
              <p className="text-sm text-muted-foreground">
                ⏳ ChatGPT está realizando análisis independiente...
              </p>
              <p className="text-sm text-muted-foreground">
                ⏳ Comparando resultados para asegurar precisión...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!geminiAnalysis || !openaiAnalysis || !comparisonResult) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-600',
          label: '✅ Aprobada'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-600',
          label: '⚠️ Con Advertencias'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-600',
          label: '❌ Rechazada'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-600',
          label: 'Desconocido'
        };
    }
  };

  const geminiConfig = getStatusConfig(geminiAnalysis.status);
  const openaiConfig = getStatusConfig(openaiAnalysis.status);

  const getAgreementBadge = () => {
    switch (comparisonResult.agreement) {
      case 'high':
        return <Badge className="bg-green-600">Alto Acuerdo</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">Acuerdo Moderado</Badge>;
      case 'low':
        return <Badge variant="destructive">Bajo Acuerdo</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner de revisión humana si es necesario */}
      {comparisonResult.needsHumanReview && (
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">
            ⚠️ SE REQUIERE REVISIÓN HUMANA INMEDIATA
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-semibold">
              Los dos agentes de IA tienen discrepancias significativas en su análisis 
              (diferencia de {comparisonResult.scoreDifference} puntos).
            </p>
            <p className="mt-2">
              Se recomienda que un farmacólogo clínico revise manualmente esta prescripción 
              antes de tomar una decisión final.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumen de comparación */}
      <Card className="border-2 border-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <GitCompare className="h-6 w-6 text-purple-600" />
              Resultado de la Comparación Multi-Agente
            </CardTitle>
            {getAgreementBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-2">
              📊 Diferencia de Scores: {comparisonResult.scoreDifference} puntos
            </p>
            <p className="text-sm text-purple-800">
              {comparisonResult.comparisonSummary}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              🎯 Recomendación Final del Sistema:
            </p>
            <p className="text-sm text-blue-800">
              {comparisonResult.finalRecommendation}
            </p>
          </div>

          {/* Tabla de discrepancias */}
          {(comparisonResult.discrepancies.status.conflict || 
            comparisonResult.discrepancies.allergies.conflict ||
            comparisonResult.discrepancies.interactions.conflict ||
            comparisonResult.discrepancies.dosage.conflict ||
            comparisonResult.discrepancies.contraindications.conflict) && (
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Discrepancias Detectadas
              </h4>
              <div className="space-y-2">
                {comparisonResult.discrepancies.status.conflict && (
                  <div className="bg-white p-3 rounded border-l-4 border-red-500">
                    <p className="text-sm font-semibold text-red-900">Status General:</p>
                    <p className="text-sm text-red-700">
                      Gemini: {geminiConfig.label} | ChatGPT: {openaiConfig.label}
                    </p>
                  </div>
                )}
                {comparisonResult.discrepancies.allergies.conflict && 
                  comparisonResult.discrepancies.allergies.differences.length > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                    <p className="text-sm font-semibold text-orange-900">Alergias:</p>
                    <ul className="text-sm text-orange-700 list-disc list-inside">
                      {comparisonResult.discrepancies.allergies.differences.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparisonResult.discrepancies.interactions.conflict && 
                  comparisonResult.discrepancies.interactions.differences.length > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                    <p className="text-sm font-semibold text-orange-900">Interacciones:</p>
                    <ul className="text-sm text-orange-700 list-disc list-inside">
                      {comparisonResult.discrepancies.interactions.differences.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparisonResult.discrepancies.dosage.conflict && 
                  comparisonResult.discrepancies.dosage.differences.length > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                    <p className="text-sm font-semibold text-yellow-900">Dosificación:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {comparisonResult.discrepancies.dosage.differences.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparisonResult.discrepancies.contraindications.conflict && 
                  comparisonResult.discrepancies.contraindications.differences.length > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-red-500">
                    <p className="text-sm font-semibold text-red-900">Contraindicaciones:</p>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {comparisonResult.discrepancies.contraindications.differences.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análisis detallados en tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Análisis Detallados de Cada Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gemini" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gemini" className="gap-2">
                <Brain className="h-4 w-4" />
                Gemini (Score: {geminiAnalysis.overallScore})
              </TabsTrigger>
              <TabsTrigger value="openai" className="gap-2">
                <Brain className="h-4 w-4" />
                ChatGPT (Score: {openaiAnalysis.overallScore})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gemini" className="space-y-4 mt-4">
              {renderAnalysisDetails(geminiAnalysis, geminiConfig, "Gemini")}
            </TabsContent>

            <TabsContent value="openai" className="space-y-4 mt-4">
              {renderAnalysisDetails(openaiAnalysis, openaiConfig, "ChatGPT")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to render analysis details
function renderAnalysisDetails(
  analysis: PrescriptionAnalysis, 
  config: any,
  agentName: string
) {
  const StatusIcon = config.icon;
  
  return (
    <>
      {/* Status Header */}
      <div className={`flex items-start gap-4 p-4 rounded-lg ${config.bgColor} border-2 ${config.borderColor}`}>
        <StatusIcon className={`h-8 w-8 ${config.color} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.color} mb-2`}>
            {config.label}
          </h3>
          <p className="text-sm text-gray-700">{analysis.summary}</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {analysis.criticalAlerts && analysis.criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Alertas Críticas - {agentName}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {analysis.criticalAlerts.map((alert, index) => (
                <li key={index} className="font-semibold">{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Findings Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Allergies */}
        <Card className={!analysis.findings.allergies.safe ? 'border-red-300 border-2' : 'border'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Alergias
              {analysis.findings.allergies.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto text-xs">✓</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto text-xs">⚠</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {renderFindingDetails(analysis.findings.allergies)}
          </CardContent>
        </Card>

        {/* Interactions */}
        <Card className={!analysis.findings.interactions.safe ? 'border-red-300 border-2' : 'border'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Interacciones
              {analysis.findings.interactions.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto text-xs">✓</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto text-xs">⚠</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {renderFindingDetails(analysis.findings.interactions)}
          </CardContent>
        </Card>

        {/* Dosage */}
        <Card className={!analysis.findings.dosage.appropriate ? 'border-yellow-300 border-2' : 'border'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dosificación
              {analysis.findings.dosage.appropriate ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto text-xs">✓</Badge>
              ) : (
                <Badge variant="secondary" className="ml-auto text-xs">⚠</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {renderFindingDetails(analysis.findings.dosage)}
          </CardContent>
        </Card>

        {/* Contraindications */}
        <Card className={!analysis.findings.contraindications.safe ? 'border-red-300 border-2' : 'border'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Contraindicaciones
              {analysis.findings.contraindications.safe ? (
                <Badge variant="outline" className="text-green-600 border-green-600 ml-auto text-xs">✓</Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto text-xs">⚠</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {renderFindingDetails(analysis.findings.contraindications)}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">📋 Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-xs text-blue-900">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Helper to render finding details
function renderFindingDetails(finding: any) {
  const hasIssues = finding.issues && finding.issues.length > 0;
  const hasSuggestions = finding.suggestions && finding.suggestions.length > 0;
  const isSafe = finding.safe !== undefined ? finding.safe : finding.appropriate;

  if (hasIssues) {
    return (
      <>
        <div className="bg-red-50 p-2 rounded">
          <p className="font-semibold text-red-600 mb-1">🚨 Problemas:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {finding.issues.map((issue: string, i: number) => (
              <li key={i} className="text-red-700">{issue}</li>
            ))}
          </ul>
        </div>
        {hasSuggestions && (
          <div className="bg-blue-50 p-2 rounded">
            <p className="font-semibold text-blue-600 mb-1">💡 Sugerencias:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {finding.suggestions.map((sugg: string, i: number) => (
                <li key={i} className="text-blue-700">{sugg}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  if (isSafe) {
    return (
      <p className="text-muted-foreground bg-green-50 p-2 rounded">
        ✓ Sin problemas detectados
      </p>
    );
  }

  return <p className="text-muted-foreground">Sin información disponible</p>;
}

