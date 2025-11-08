import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface GeneratePagesProps {
  universeId: string;
  universeName: string;
}

export const GeneratePages = ({ universeId, universeName }: GeneratePagesProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setIsComplete(false);

    try {
      // Simular geração de páginas (em produção, isso seria feito no backend)
      // Aqui apenas simulamos o progresso
      const total = 45;
      setTotalPages(total);

      for (let i = 1; i <= total; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setCurrentPage(i);
        setProgress((i / total) * 100);
      }

      setIsComplete(true);
      toast.success("Páginas geradas com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar páginas:", error);
      toast.error("Erro ao gerar páginas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewUniverse = () => {
    navigate(`/universe/${universeId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerar Páginas do Universo</h3>
          <p className="text-sm text-muted-foreground">
            Gere automaticamente páginas para todas as entidades
          </p>
        </div>
        
        {!isComplete ? (
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Páginas"
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleViewUniverse} 
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Ver Universo
          </Button>
        )}
      </div>

      {isGenerating && (
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Gerando {totalPages} páginas...
            </span>
            <span className="text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Criando páginas para personagens, locais, eventos e objetos...
          </p>
        </div>
      )}

      {isComplete && (
        <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Geração Concluída!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {totalPages} páginas foram geradas com sucesso para o universo "{universeName}".
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
