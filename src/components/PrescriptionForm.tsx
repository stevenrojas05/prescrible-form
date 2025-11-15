import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Pill, AlertCircle, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import medicationsData from "@/data/medications.json";
import patientsData from "@/data/patients.json";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { analyzePrescription, PrescriptionAnalysis as AnalysisType } from "@/services/prescriptionAgent";
import { analyzeWithOpenAI } from "@/services/openaiAgent";
import { compareAnalyses, ComparisonResult } from "@/services/comparisonAgent";
import { ComparisonAnalysis } from "@/components/ComparisonAnalysis";

const medicationSchema = z.object({
  name: z.string().min(1, "El nombre del medicamento es requerido"),
  route: z.string().min(1, "La vía de administración es requerida"),
  dose: z.string().min(1, "La dosis es requerida"),
  unit: z.string().min(1, "La unidad es requerida"),
  singleDose: z.boolean().default(false),
  frequency: z.string().optional(),
  frequencyUnit: z.string().optional(),
}).refine((data) => {
  if (!data.singleDose && !data.frequency) {
    return false;
  }
  return true;
}, {
  message: "La frecuencia es requerida cuando no es dosis única",
  path: ["frequency"],
});

const prescriptionSchema = z.object({
  patient: z.string().min(1, "Seleccione un paciente"),
  diagnosis: z.string().min(3, "El diagnóstico debe tener al menos 3 caracteres"),
  medications: z.array(medicationSchema).min(1, "Agregue al menos un medicamento"),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

const routes = [
  "Oral",
  "Intravenosa",
  "Intramuscular",
  "Subcutánea",
  "Tópica",
  "Oftálmica",
  "Ótica",
  "Rectal",
  "Sublingual",
];

const units = ["mg", "ml", "g", "mcg", "UI", "gotas", "comprimidos"];

export function PrescriptionForm() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<AnalysisType | null>(null);
  const [openaiAnalysis, setOpenaiAnalysis] = useState<AnalysisType | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patient: "",
      diagnosis: "",
      medications: [
        {
          name: "",
          route: "",
          dose: "",
          unit: "",
          singleDose: false,
          frequency: "",
          frequencyUnit: "horas",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const selectedPatient = useMemo(() => {
    return patientsData.patients.find(p => p.patient_id === selectedPatientId);
  }, [selectedPatientId]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const onSubmit = async (data: PrescriptionFormValues) => {
    setIsAnalyzing(true);
    setShowAnalysisDialog(true);
    setGeminiAnalysis(null);
    setOpenaiAnalysis(null);
    setComparisonResult(null);
    
    try {
      // Obtener datos del paciente seleccionado
      const patient = patientsData.patients.find(p => p.patient_id === data.patient);
      
      if (!patient) {
        toast.error("Paciente no encontrado");
        setIsAnalyzing(false);
        return;
      }

      console.log('🚀 Iniciando análisis multi-agente...');
      
      // PASO 1: Ejecutar Gemini y OpenAI en PARALELO
      const [geminiResult, openaiResult] = await Promise.all([
        analyzePrescription(data, patient),
        analyzeWithOpenAI(data, patient)
      ]);
      
      console.log('✅ Ambos agentes completaron su análisis');
      setGeminiAnalysis(geminiResult);
      setOpenaiAnalysis(openaiResult);
      
      // PASO 2: Comparar los resultados con el tercer agente
      console.log('🔍 Iniciando comparación de resultados...');
      const comparison = await compareAnalyses(geminiResult, openaiResult, data);
      setComparisonResult(comparison);
      console.log('✅ Comparación completada');
      
      // Mostrar resultado según la comparación
      if (comparison.needsHumanReview) {
        toast.error("⚠️ SE REQUIERE REVISIÓN HUMANA - Discrepancias significativas detectadas");
      } else if (comparison.agreement === 'high') {
        toast.success("✅ Ambos agentes coinciden - Alto nivel de confianza");
      } else if (comparison.agreement === 'medium') {
        toast.warning("⚠️ Acuerdo moderado entre agentes - Revisar diferencias");
      } else {
        toast.warning("⚠️ Bajo acuerdo entre agentes - Se recomienda precaución");
      }
      
    } catch (error: any) {
      console.error('Error analyzing prescription:', error);
      toast.error(error.message || "Error al analizar la prescripción");
      setShowAnalysisDialog(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSavePrescription = () => {
    console.log("Guardando prescripción aprobada:", { geminiAnalysis, openaiAnalysis, comparisonResult });
    toast.success("✅ Prescripción guardada exitosamente");
    setShowAnalysisDialog(false);
  };

  const handleSaveWithWarnings = () => {
    console.log("Guardando prescripción con advertencias:", { geminiAnalysis, openaiAnalysis, comparisonResult });
    toast.info("⚠️ Prescripción guardada con advertencias registradas");
    setShowAnalysisDialog(false);
  };

  const handleClearForm = () => {
    // Resetear el formulario a valores por defecto
    form.reset({
      patient: "",
      diagnosis: "",
      medications: [
        {
          name: "",
          route: "",
          dose: "",
          unit: "",
          singleDose: false,
          frequency: "",
          frequencyUnit: "horas",
        },
      ],
    });
    // Limpiar estados
    setSelectedPatientId("");
    setGeminiAnalysis(null);
    setOpenaiAnalysis(null);
    setComparisonResult(null);
    setShowAnalysisDialog(false);
    // Notificación
    toast.info("Formulario limpiado");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="patient" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patient" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información del Paciente
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medicamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="patient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedPatientId(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover z-50">
                          {patientsData.patients.map((patient) => (
                            <SelectItem key={patient.patient_id} value={patient.patient_id}>
                              {patient.nombre} {patient.apellido} - {calculateAge(patient.fecha_nacimiento)} años ({patient.documento})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ingrese el diagnóstico del paciente"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {selectedPatient && (
              <>
                {selectedPatient.alergias.length > 0 && selectedPatient.alergias[0].alergeno !== "Ninguna conocida" && (
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                        <AlertCircle className="h-5 w-5" />
                        Alergias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedPatient.alergias.map((alergia, index) => (
                          <div key={index} className="p-3 bg-destructive/10 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-destructive">{alergia.alergeno}</span>
                              <Badge variant="destructive">{alergia.severidad}</Badge>
                            </div>
                            {alergia.reaccion && (
                              <p className="text-sm text-muted-foreground mb-1">
                                Reacción: {alergia.reaccion}
                              </p>
                            )}
                            {alergia.notas && (
                              <p className="text-sm text-muted-foreground">
                                {alergia.notas}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <History className="h-5 w-5" />
                      Medicamentos Anteriores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPatient.medicamentos_recetados_anteriores.length > 0 ? (
                      <div className="space-y-3">
                        {selectedPatient.medicamentos_recetados_anteriores.map((med, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{med.nombre_generico}</span>
                              <Badge variant={med.estatus === "activo" ? "default" : "secondary"}>
                                {med.estatus}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <p>Concentración: {med.concentracion}</p>
                              <p>Vía: {med.via}</p>
                              <p>Dosis: {med.dosis} {med.unidad}</p>
                              <p>Frecuencia: {med.frecuencia}</p>
                            </div>
                            {med.indicación && (
                              <p className="text-sm mt-2">
                                <span className="font-medium">Indicación:</span> {med.indicación}
                              </p>
                            )}
                            {med.notas && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {med.notas}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No hay medicamentos registrados</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="medications" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-primary">Medicamentos</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: "",
                      route: "",
                      dose: "",
                      unit: "",
                      singleDose: false,
                      frequency: "",
                      frequencyUnit: "horas",
                    })
                  }
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Medicamento
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-secondary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-foreground">
                          Medicamento #{index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`medications.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Medicamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un medicamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover z-50">
                                {medicationsData.map((medication) => (
                                  <SelectItem key={medication.id} value={medication.name}>
                                    {medication.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`medications.${index}.route`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vía de Administración</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la vía" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {routes.map((route) => (
                                  <SelectItem key={route} value={route}>
                                    {route}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`medications.${index}.dose`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dosis</FormLabel>
                              <FormControl>
                                <Input placeholder="500" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`medications.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidad</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unidad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {units.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`medications.${index}.singleDose`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Dosis Única</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      {!form.watch(`medications.${index}.singleDose`) && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`medications.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frecuencia</FormLabel>
                                <FormControl>
                                  <Input placeholder="8" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`medications.${index}.frequencyUnit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unidad de Frecuencia</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="horas">Horas</SelectItem>
                                    <SelectItem value="dias">Días</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleClearForm}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar Formulario
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? "Analizando..." : "Analizar y Guardar Prescripción"}
            </Button>
          </div>
        </div>

        {/* Diálogo de análisis multi-agente */}
        <AlertDialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <AlertDialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">
                🤖 Análisis Multi-Agente de Prescripción
              </AlertDialogTitle>
              <AlertDialogDescription>
                Revisión automática con Gemini y ChatGPT, validada mediante comparación inteligente
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <ComparisonAnalysis 
              geminiAnalysis={geminiAnalysis}
              openaiAnalysis={openaiAnalysis}
              comparisonResult={comparisonResult}
              isLoading={isAnalyzing}
            />
            
            <AlertDialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAnalysisDialog(false)}
                disabled={isAnalyzing}
              >
                Cerrar
              </Button>
              
              {comparisonResult && !comparisonResult.needsHumanReview && (
                <>
                  {(geminiAnalysis?.status === 'approved' || openaiAnalysis?.status === 'approved') && (
                    <Button 
                      onClick={handleSavePrescription}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ✓ Confirmar y Guardar
                    </Button>
                  )}
                  
                  {(geminiAnalysis?.status === 'warning' || openaiAnalysis?.status === 'warning') && (
                    <Button 
                      variant="secondary" 
                      onClick={handleSaveWithWarnings}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      ⚠ Aceptar con Advertencias
                    </Button>
                  )}
                </>
              )}
              
              {comparisonResult?.needsHumanReview && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowAnalysisDialog(false)}
                >
                  ⚠️ Enviar a Revisión Humana
                </Button>
              )}
              
              {(geminiAnalysis?.status === 'rejected' || openaiAnalysis?.status === 'rejected') && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnalysisDialog(false)}
                >
                  ✗ Corregir Prescripción
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
