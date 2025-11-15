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
import { Plus, Trash2, FileText, Pill, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";
import medicationsData from "@/data/medications.json";
import patientsData from "@/data/patients.json";

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

  const onSubmit = (data: PrescriptionFormValues) => {
    console.log("Prescription data:", data);
    toast.success("Prescripción guardada exitosamente");
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit">Guardar Prescripción</Button>
        </div>
      </form>
    </Form>
  );
}
