import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [success, setSuccess] = useState(false);
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
    setProgress(10);
    setCurrentStep("Validando arquivo");
    setSuccess(false);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create universe
      setProgress(20);
      setCurrentStep("Criando universo");

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

      // Read PDF content (simplified - in production use a proper PDF parser)
      setProgress(40);
      setCurrentStep("Extraindo texto do PDF");

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const pdfText = event.target?.result as string;
          
          // Call edge function to process with Deepseek
          setProgress(50);
          setCurrentStep("Processando com IA");

          const { error: functionError } = await supabase.functions.invoke('process-pdf', {
            body: {
              universeId: universe.id,
              pdfText: pdfText.substring(0, 10000), // Limit for demo
            },
          });

          if (functionError) throw functionError;

          setProgress(100);
          setCurrentStep("Concluído");
          setSuccess(true);

          toast({
            title: "Sucesso!",
            description: "Universo criado e processado com sucesso.",
          });

          // Reset form
          setTimeout(() => {
            setFile(null);
            setName("");
            setDescription("");
            setSourceType("");
            setAuthor("");
            setYear("");
            setProcessing(false);
            setProgress(0);
            setCurrentStep("");
            setSuccess(false);
          }, 3000);

        } catch (error: any) {
          console.error("Error processing PDF:", error);
          toast({
            title: "Erro no processamento",
            description: error.message || "Ocorreu um erro ao processar o PDF.",
            variant: "destructive",
          });
          setProcessing(false);
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

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-2">Upload de PDF</h1>
      <p className="text-gray-600 mb-8">
        Faça upload de um PDF para criar automaticamente um novo universo narrativo
      </p>

      <Card className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <Label className="text-navy mb-2 block">Arquivo PDF *</Label>
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
                <p className="text-navy font-medium mb-1">
                  {file ? file.name : "Clique para selecionar ou arraste um arquivo"}
                </p>
                <p className="text-sm text-gray-500">PDF até 50MB</p>
              </label>
            </div>
          </div>

          {/* Universe Details */}
          <div>
            <Label htmlFor="name" className="text-navy">Nome do Universo *</Label>
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
            <Label htmlFor="description" className="text-navy">Descrição *</Label>
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
            <Label htmlFor="sourceType" className="text-navy">Tipo de Fonte *</Label>
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
              <Label htmlFor="author" className="text-navy">Autor/Criador</Label>
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
              <Label htmlFor="year" className="text-navy">Ano de Publicação</Label>
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

          {/* Processing Status */}
          {processing && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-navy">{currentStep}</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-600">
                Tempo estimado: 2-5 minutos
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Universo criado com sucesso!</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!file || !name || !description || !sourceType || processing}
              className="flex-1 bg-navy hover:bg-navy/90 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Processar PDF"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFile(null);
                setName("");
                setDescription("");
                setSourceType("");
                setAuthor("");
                setYear("");
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}