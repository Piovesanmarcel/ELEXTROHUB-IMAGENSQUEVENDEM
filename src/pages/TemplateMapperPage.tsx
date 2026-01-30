import { TemplateMapper } from "@/components/admin/TemplateMapper";

export default function TemplateMapperPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Editor de Templates de Marketing</h1>
      <p className="text-muted-foreground mb-6">
        Crie e edite templates mapeando visualmente zonas de imagens e textos
      </p>
      <TemplateMapper />
    </div>
  );
}
