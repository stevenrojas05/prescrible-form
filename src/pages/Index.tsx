import { PrescriptionForm } from "@/components/PrescriptionForm";
import { Stethoscope } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">MediScript</h1>
              <p className="text-sm text-muted-foreground">Sistema de Prescripción Médica</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">Nueva Prescripción</h2>
          <p className="text-muted-foreground">
            Complete el formulario para generar una nueva prescripción médica
          </p>
        </div>
        
        <PrescriptionForm />
      </main>
    </div>
  );
};

export default Index;
