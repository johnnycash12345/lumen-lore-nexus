import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, Edit3, RefreshCw, Sparkles } from "lucide-react";
import { ExtractionMonitor } from "@/components/ExtractionMonitor";
import { ExtractedEntitiesView } from "@/components/ExtractedEntitiesView";
import { QualityValidation } from "@/components/QualityValidation";
import { EditEntities } from "@/components/EditEntities";
import { RelationshipEditor } from "@/components/RelationshipEditor";
import { GeneratePages } from "@/components/GeneratePages";
import { UniverseChat } from "@/components/UniverseChat";
import { InteractiveTimeline } from "@/components/InteractiveTimeline";
import { RelationshipMatrix } from "@/components/RelationshipMatrix";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extrai texto de um arquivo PDF
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Verificar se é um PDF válido
    const header = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...header);
    
    if (!headerStr.startsWith('%PDF')) {
      throw new Error('O arquivo não é um PDF válido.');
    }
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = '';
    let totalChars = 0;
    
    // Extrair texto de cada página
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => {
          // Garantir que é uma string
          if (typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .filter(str => str.trim().length > 0)
        .join(' ');
      
      if (pageText.trim().length > 0) {
        fullText += pageText + '\n\n';
        totalChars += pageText.length;
      }
      
      console.log(`Page ${i}: ${pageText.length} characters extracted`);
    }
    
    console.log(`Total extracted: ${totalChars} characters from ${pdf.numPages} pages`);
    
    if (totalChars === 0) {
      throw new Error('O PDF não contém texto extraível. O PDF pode estar escaneado (apenas imagens). Use um PDF com texto selecionável ou converta o PDF escaneado usando OCR.');
    }
    
    return fullText.trim();
    
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Erro ao extrair texto do PDF: ${error.message}`);
  }
}

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [processing, setProcessing] = useState(false);
  const [universeId, setUniverseId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [entityCounts, setEntityCounts] = useState({ characters: 0, locations: 0, events: 0, objects: 0 });
  const [activeTab, setActiveTab] = useState("monitor");
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Extract text from PDF properly
      try {
        toast({
          title: "Extraindo texto do PDF...",
          description: "Analisando o arquivo...",
        });

        const pdfText = await extractTextFromPDF(file);
        
        if (!pdfText || pdfText.length < 100) {
          throw new Error("❌ O PDF não contém texto suficiente. Mínimo: 100 caracteres.\n\n⚠️ IMPORTANTE:\n• Se o PDF for escaneado (imagem), ele NÃO FUNCIONARÁ\n• Use um PDF com texto SELECIONÁVEL\n• Teste selecionando texto no PDF antes de fazer upload");
        }

        // Validate extracted text quality
        const readableChars = pdfText.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?'"()\-]/g);
        const readableRatio = readableChars ? readableChars.length / pdfText.length : 0;
        
        if (readableRatio < 0.5) {
          throw new Error(`❌ O texto extraído tem baixa qualidade (${(readableRatio * 100).toFixed(1)}% legível).\n\n⚠️ POSSÍVEIS CAUSAS:\n• PDF escaneado (apenas imagens)\n• PDF corrompido\n• Codificação incorreta\n\n✅ SOLUÇÃO: Use um PDF com texto selecionável`);
        }

        // Check for binary indicators
        const hasBinary = pdfText.includes('endstream') || 
                         pdfText.includes('endobj') || 
                         pdfText.includes('JFIF') ||
                         pdfText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
        
        if (hasBinary) {
          throw new Error(`❌ O PDF contém dados binários não processados.\n\n⚠️ O PDF pode estar:\n• Escaneado (imagem)\n• Mal formatado\n• Corrompido\n\n✅ SOLUÇÃO: Use um PDF diferente com texto selecionável`);
        }

        console.log(`✅ PDF Text Extracted Successfully:`);
        console.log(`   - Length: ${pdfText.length} characters`);
        console.log(`   - Readability: ${(readableRatio * 100).toFixed(1)}%`);
        console.log(`   - First 1000 chars:`, pdfText.substring(0, 1000));
        
        toast({
          title: "✅ Texto extraído com sucesso!",
          description: `${pdfText.length.toLocaleString()} caracteres (${(readableRatio * 100).toFixed(0)}% legível)`,
        });

        // Call edge function to process with Deepseek
        const { error: functionError } = await supabase.functions.invoke('process-pdf', {
          body: {
            universeId: universe.id,
            pdfText: pdfText, // Send full extracted text
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

  const handleExtractionComplete = async () => {
    setIsComplete(true);
    setProcessing(false);
    
    // Fetch entity counts
    if (universeId) {
      const [charsRes, locsRes, eventsRes, objsRes] = await Promise.all([
        supabase.from("characters").select("id", { count: "exact" }).eq("universe_id", universeId),
        supabase.from("locations").select("id", { count: "exact" }).eq("universe_id", universeId),
        supabase.from("events").select("id", { count: "exact" }).eq("universe_id", universeId),
        supabase.from("objects").select("id", { count: "exact" }).eq("universe_id", universeId),
      ]);
      
      setEntityCounts({
        characters: charsRes.count || 0,
        locations: locsRes.count || 0,
        events: eventsRes.count || 0,
        objects: objsRes.count || 0,
      });
    }
    
    toast({
      title: "Extração concluída!",
      description: "Revise a qualidade e as entidades extraídas.",
    });
  };

  const handlePublish = async () => {
    if (!universeId) return;
    
    try {
      const { error } = await supabase
        .from("universes")
        .update({ status: "active" })
        .eq("id", universeId);
      
      if (error) throw error;
      
      toast({
        title: "Universo publicado!",
        description: "O universo está agora visível publicamente.",
      });
      
      navigate(`/universe/${universeId}`);
    } catch (error: any) {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setActiveTab("entities");
    toast({
      title: "Modo de edição",
      description: "Revise e edite as entidades extraídas.",
    });
  };

  const handleReprocess = async () => {
    if (!universeId) return;
    
    setIsComplete(false);
    setProcessing(true);
    setActiveTab("monitor");
    
    try {
      // Reset processing job
      await supabase
        .from("processing_jobs")
        .update({
          status: "processing",
          progress: 0,
          current_step: "Reiniciando extração",
        })
        .eq("universe_id", universeId);
      
      // Delete existing entities
      await Promise.all([
        supabase.from("characters").delete().eq("universe_id", universeId),
        supabase.from("locations").delete().eq("universe_id", universeId),
        supabase.from("events").delete().eq("universe_id", universeId),
        supabase.from("objects").delete().eq("universe_id", universeId),
      ]);
      
      // Re-invoke processing
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const pdfText = event.target?.result as string;
          await supabase.functions.invoke('process-pdf', {
            body: {
              universeId,
              pdfText: pdfText.substring(0, 10000),
            },
          });
        };
        reader.readAsText(file);
      }
      
      toast({
        title: "Reprocessando",
        description: "Iniciando nova extração do PDF.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reprocessar",
        description: error.message,
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
    setIsComplete(false);
    setActiveTab("monitor");
  };

  return (
    <div>
      <h1 className="text-3xl font-serif text-lumen-navy mb-2">Upload de PDF</h1>
      <p className="text-gray-600 mb-8">
        Faça upload de um PDF para criar automaticamente um novo universo narrativo
      </p>

      {/* Upload Form - Only show if not processing */}
      {!universeId && (
        <Card className="p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
          </form>
        </Card>
      )}

      {/* Processing View with Tabs */}
      {universeId && (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 overflow-x-auto">
              <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
              <TabsTrigger value="entities" disabled={!isComplete}>Entidades</TabsTrigger>
              <TabsTrigger value="quality" disabled={!isComplete}>Qualidade</TabsTrigger>
              <TabsTrigger value="edit" disabled={!isComplete}>Editar</TabsTrigger>
              <TabsTrigger value="relationships" disabled={!isComplete}>Relacionamentos</TabsTrigger>
              <TabsTrigger value="timeline" disabled={!isComplete}>Timeline</TabsTrigger>
              <TabsTrigger value="matrix" disabled={!isComplete}>Matriz</TabsTrigger>
              <TabsTrigger value="chat" disabled={!isComplete}>Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="monitor" className="space-y-6">
              <ExtractionMonitor 
                universeId={universeId}
                onComplete={handleExtractionComplete}
              />
            </TabsContent>

            <TabsContent value="entities" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <ExtractedEntitiesView universeId={universeId} />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              {isComplete && (
                <QualityValidation
                  universeId={universeId}
                  entityCounts={entityCounts}
                  onAccept={handlePublish}
                  onReview={handleEdit}
                  onReprocess={handleReprocess}
                />
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <EditEntities universeId={universeId} />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="relationships" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <RelationshipEditor universeId={universeId} />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <InteractiveTimeline universeId={universeId} />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="matrix" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <RelationshipMatrix universeId={universeId} />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              {isComplete && (
                <Card className="p-6">
                  <UniverseChat 
                    universeId={universeId} 
                    universeName={name}
                  />
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Final Action Buttons */}
          {isComplete && (
            <Card className="p-6">
              <div className="space-y-4">
                <GeneratePages 
                  universeId={universeId} 
                  universeName={name}
                />
                
                <div className="flex gap-4">
                  <Button
                    onClick={handlePublish}
                    className="flex-1 bg-lumen-navy hover:bg-lumen-navy/90 text-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Publicar Universo
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar Entidades
                  </Button>
                  <Button
                    onClick={handleReprocess}
                    variant="outline"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reprocessar
                  </Button>
                </div>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="w-full"
                >
                  Novo Upload
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}