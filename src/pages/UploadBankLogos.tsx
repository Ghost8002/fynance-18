/**
 * Página auxiliar para fazer upload dos logos dos bancos
 * Acesse /upload-logos para executar o upload
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadAllBankLogos } from "@/utils/banks/uploadBankLogos";
import { Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";

export default function UploadBankLogos() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);
    setUploadResults(null);

    try {
      const results = await uploadAllBankLogos();
      setUploadResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload dos logos');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upload de Logos dos Bancos</h1>
          <p className="text-muted-foreground mt-2">
            Esta página permite fazer upload dos logos dos bancos para o Supabase Storage.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fazer Upload dos Logos</CardTitle>
            <CardDescription>
              Clique no botão abaixo para fazer upload de todos os logos dos bancos para o storage.
              Este processo pode levar alguns segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              size="lg"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fazendo upload...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Iniciar Upload
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {uploadResults && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Upload concluído com sucesso! {Object.keys(uploadResults).length} logos foram enviados.
                </AlertDescription>
              </Alert>
            )}

            {uploadResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">URLs Geradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(uploadResults, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            <strong>Nota:</strong> Após o upload, atualize o arquivo <code>bankDatabase.ts</code> 
            com as URLs geradas acima para que os logos apareçam corretamente no sistema.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
