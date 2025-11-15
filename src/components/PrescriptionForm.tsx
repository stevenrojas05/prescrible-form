import { useState } from "react";
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
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

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

// Mock data for patients
const patients = [
  { id: "1", name: "Juan Pérez García", age: 45 },
  { id: "2", name: "María López Rodríguez", age: 32 },
  { id: "3", name: "Carlos Sánchez Martínez", age: 58 },
  { id: "4", name: "Ana Torres Fernández", age: 29 },
];

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

  const onSubmit = (data: PrescriptionFormValues) => {
    console.log("Prescription data:", data);
    toast.success("Prescripción guardada exitosamente");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="patient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.age} años
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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
                        <FormControl>
                          <Input placeholder="Ej: Paracetamol" {...field} />
                        </FormControl>
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
                            <Input type="number" placeholder="Ej: 500" {...field} />
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
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
                              <Input type="number" placeholder="Ej: 8" {...field} />
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
                            <FormLabel>Cada</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="horas">Horas</SelectItem>
                                <SelectItem value="días">Días</SelectItem>
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90">
            Guardar Prescripción
          </Button>
        </div>
      </form>
    </Form>
  );
}
