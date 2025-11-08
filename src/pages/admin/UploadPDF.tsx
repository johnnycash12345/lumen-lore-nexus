import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { ExtractionMonitor } from "@/components/ExtractionMonitor";

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [processing, setProcessing] = useState(false);
  const [universeId, setUniverseId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Erro",
          description: "Apenas arquivos PDF são permitidos.",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "O arquivo não pode ser maior que 50MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !description || !sourceType) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create universe
      const { data: universe, error: universeError } = await supabase
        .from("universes")
        .insert({
          name,
          description,
          source_type: sourceType,
          author: author || null,
          publication_year: year ? parseInt(year) : null,
          created_by: user.id,
          status: "processing",
        })
        .select()
        .single();

      if (universeError) throw universeError;

      // Create processing job
      const { error: jobError } = await supabase
        .from("processing_jobs")
        .insert({
          universe_id: universe.id,
          status: "processing",
          progress: 20,
          current_step: "Extraindo texto do PDF",
        });

      if (jobError) throw jobError;

      // Set universe ID to show monitor
      setUniverseId(universe.id);

      // Read PDF content (simplified - in production use a proper PDF parser)
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const pdfText = event.target?.result as string;
          
          // Call edge function to process with Deepseek
          const { error: functionError } = await supabase.functions.invoke('process-pdf', {
            body: {
              universeId: universe.id,
              pdfText: pdfText.substring(0, 10000), // Limit for demo
            },
          });

          if (functionError) throw functionError;

        } catch (error: any) {
          console.error("Error processing PDF:", error);
          toast({
            title: "Erro no processamento",
            description: error.message || "Ocorreu um erro ao processar o PDF.",
            variant: "destructive",
          });
          setProcessing(false);
          setUniverseId(null);
        }
      };

      reader.readAsText(file);

    } catch (error: any) {
      console.error("Error creating universe:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setSourceType("");
    setAuthor("");
    setYear("");
    setProcessing(false);
    setUniverseId(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-serif text-lumen-navy mb-2">Upload de PDF</h1>
      <p className="text-gray-600 mb-8">
        Faça upload de um PDF para criar automaticamente um novo universo narrativo
      </p>

      <Card className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <Label className="text-lumen-navy mb-2 block">Arquivo PDF *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-golden transition-colors">
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={processing}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lumen-navy font-medium mb-1">
                  {file ? file.name : "Clique para selecionar ou arraste um arquivo"}
                </p>
                <p className="text-sm text-gray-500">PDF até 50MB</p>
              </label>
            </div>
          </div>

          {/* Universe Details */}
          <div>
            <Label htmlFor="name" className="text-lumen-navy">Nome do Universo *</Label>
            <Input
              id="name"
              placeholder="ex: Harry Potter e a Pedra Filosofal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              disabled={processing}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-lumen-navy">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="ex: O primeiro livro da série Harry Potter"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={500}
              rows={3}
              disabled={processing}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sourceType" className="text-lumen-navy">Tipo de Fonte *</Label>
            <Select value={sourceType} onValueChange={setSourceType} disabled={processing}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Livro">📚 Livro</SelectItem>
                <SelectItem value="Filme">🎬 Filme</SelectItem>
                <SelectItem value="Série">📺 Série</SelectItem>
                <SelectItem value="Jogo">🎮 Jogo</SelectItem>
                <SelectItem value="Outro">📋 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author" className="text-lumen-navy">Autor/Criador</Label>
              <Input
                id="author"
                placeholder="ex: J.K. Rowling"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={processing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="year" className="text-lumen-navy">Ano de Publicação</Label>
              <Input
                id="year"
                type="number"
                placeholder="ex: 1997"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="1000"
                max="2100"
                disabled={processing}
                className="mt-1"
              />
            </div>
          </div>

          {/* Extraction Monitor */}
          {universeId && (
            <ExtractionMonitor 
              universeId={universeId}
              onComplete={() => {
                toast({
                  title: "Sucesso!",
                  description: "Universo criado e processado com sucesso.",
                });
              }}
            />
          )}

          {/* Buttons */}
          {!universeId && (
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!file || !name || !description || !sourceType || processing}
                className="flex-1 bg-lumen-navy hover:bg-lumen-navy/90 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando processamento...
                  </>
                ) : (
                  "Processar PDF"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={processing}
              >
                Cancelar
              </Button>
            </div>
          )}
          
          {/* Reset Button after completion */}
          {universeId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              Novo Upload
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}