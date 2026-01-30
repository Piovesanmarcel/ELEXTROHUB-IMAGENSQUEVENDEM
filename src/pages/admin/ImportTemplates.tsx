import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ImportTemplatesPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors?: string[] } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      
      // Pular header "json_agg" e pegar a linha com o JSON
      let jsonLine = lines[1] || lines[0];
      
      // Remover aspas externas do CSV e corrigir aspas escapadas
      if (jsonLine.startsWith('"') && jsonLine.endsWith('"')) {
        jsonLine = jsonLine.slice(1, -1);
      }
      jsonLine = jsonLine.replace(/""/g, '"');
      
      const parsed = JSON.parse(jsonLine);
      setTemplates(parsed);
      toast.success(`${parsed.length} templates encontrados no arquivo`);
    } catch (error) {
      console.error('Erro ao parsear arquivo:', error);
      toast.error('Erro ao ler o arquivo CSV. Verifique o formato.');
      setTemplates(null);
    }
  };

  const handleImport = async () => {
    if (!templates) return;

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-templates', {
        body: { templates }
      });

      if (error) throw error;

      setResult(data);
      if (data.success) {
        toast.success(`✅ ${data.imported} templates importados com sucesso!`);
      } else {
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Templates do CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selecione o arquivo CSV exportado do Supabase
            </label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {templates && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{templates.length} templates prontos para importar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Categorias: {[...new Set(templates.map(t => t.category))].join(', ')}
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!templates || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar {templates?.length || 0} Templates
              </>
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              result.errors?.length ? 'bg-yellow-500/10' : 'bg-green-500/10'
            }`}>
              {result.errors?.length ? (
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {result.imported} templates importados com sucesso!
                </p>
                {result.errors?.length && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Alguns erros ocorreram:</p>
                    <ul className="list-disc list-inside mt-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportTemplatesPage;
