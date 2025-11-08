import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileEdit,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QualityMetrics {
  completeness: number;
  consistency: number;
  accuracy: number;
  richness: number;
}

interface QualityValidationProps {
  universeId: string;
  metrics?: QualityMetrics;
  entityCounts: {
    characters: number;
    locations: number;
    events: number;
    objects: number;
  };
  onAccept?: () => void;
  onReview?: () => void;
  onReprocess?: () => void;
}

export const QualityValidation = ({
  universeId,
  metrics,
  entityCounts,
  onAccept,
  onReview,
  onReprocess,
}: QualityValidationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular score geral baseado nas métricas ou contagem de entidades
  const calculateOverallScore = (): number => {
    if (metrics) {
      return Math.round(
        (metrics.completeness + metrics.consistency + metrics.accuracy + metrics.richness) / 4
      );
    }
    
    // Score baseado na quantidade de entidades extraídas
    const total = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    if (total < 5) return 40;
    if (total < 15) return 60;
    if (total < 30) return 75;
    if (total < 50) return 85;
    return 95;
  };

  const overallScore = calculateOverallScore();

  // Determinar cor e status baseado no score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: "Excelente", variant: "default" as const };
    if (score >= 60) return { label: "Boa", variant: "secondary" as const };
    return { label: "Baixa", variant: "destructive" as const };
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-5 w-5" />;
    if (score >= 60) return <Minus className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  // Gerar recomendações baseadas nas métricas
  const generateRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const total = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);

    if (total < 10) {
      recommendations.push("Poucas entidades extraídas. Considere usar um PDF mais detalhado.");
    }

    if (entityCounts.characters === 0) {
      recommendations.push("Nenhum personagem identificado. Verifique se o documento contém informações sobre personagens.");
    }

    if (entityCounts.locations === 0) {
      recommendations.push("Nenhum local identificado. Adicione informações sobre locais importantes.");
    }

    if (entityCounts.events === 0) {
      recommendations.push("Nenhum evento identificado. Inclua eventos ou acontecimentos relevantes.");
    }

    if (metrics) {
      if (metrics.completeness < 70) {
        recommendations.push("Completude baixa. Algumas entidades podem estar com informações incompletas.");
      }
      if (metrics.consistency < 70) {
        recommendations.push("Inconsistências detectadas. Revise as relações entre entidades.");
      }
      if (metrics.accuracy < 70) {
        recommendations.push("Precisão abaixo do ideal. Valide as informações extraídas.");
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Extração de qualidade! Todas as métricas estão boas.");
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();
  const status = getScoreStatus(overallScore);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReview = async () => {
    setIsProcessing(true);
    try {
      await onReview?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      await onReprocess?.();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Validação de Qualidade
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardTitle>
            <CardDescription>
              Análise automática da extração de entidades
            </CardDescription>
          </div>
          <div className={cn("text-4xl font-bold", getScoreColor(overallScore))}>
            <div className="flex items-center gap-2">
              {getScoreIcon(overallScore)}
              {overallScore}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Barra de progresso geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Score Geral</span>
            <span className={cn("font-medium", getScoreColor(overallScore))}>
              {overallScore}%
            </span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Métricas individuais se disponíveis */}
        {metrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Completude</div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.completeness} className="h-2 flex-1" />
                <span className="text-sm font-medium">{metrics.completeness}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Consistência</div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.consistency} className="h-2 flex-1" />
                <span className="text-sm font-medium">{metrics.consistency}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Precisão</div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.accuracy} className="h-2 flex-1" />
                <span className="text-sm font-medium">{metrics.accuracy}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Riqueza</div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.richness} className="h-2 flex-1" />
                <span className="text-sm font-medium">{metrics.richness}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Resumo de entidades */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{entityCounts.characters}</div>
            <div className="text-xs text-muted-foreground">Personagens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{entityCounts.locations}</div>
            <div className="text-xs text-muted-foreground">Locais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{entityCounts.events}</div>
            <div className="text-xs text-muted-foreground">Eventos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{entityCounts.objects}</div>
            <div className="text-xs text-muted-foreground">Objetos</div>
          </div>
        </div>

        {/* Recomendações */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Recomendações
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1"
            variant="default"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aceitar
          </Button>
          <Button
            onClick={handleReview}
            disabled={isProcessing}
            className="flex-1"
            variant="secondary"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Revisar
          </Button>
          <Button
            onClick={handleReprocess}
            disabled={isProcessing}
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isProcessing && "animate-spin")} />
            Reprocessar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
