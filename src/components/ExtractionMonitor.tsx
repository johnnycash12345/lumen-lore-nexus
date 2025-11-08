import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, Users, MapPin, Calendar, Package } from "lucide-react";

interface ExtractionMonitorProps {
  universeId: string;
  onComplete?: () => void;
}

interface ProcessingJob {
  id: string;
  universe_id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  current_step: string | null;
  error_message: string | null;
}

interface EntityCounts {
  characters: number;
  locations: number;
  events: number;
  objects: number;
}

export const ExtractionMonitor = ({ universeId, onComplete }: ExtractionMonitorProps) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [counts, setCounts] = useState<EntityCounts>({
    characters: 0,
    locations: 0,
    events: 0,
    objects: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobStatus();

    // Poll every 2 seconds
    const interval = setInterval(() => {
      fetchJobStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [universeId]);

  const fetchJobStatus = async () => {
    try {
      // Fetch processing job
      const { data: jobData, error: jobError } = await supabase
        .from("processing_jobs")
        .select("*")
        .eq("universe_id", universeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobError) throw jobError;

      if (jobData) {
        setJob(jobData as ProcessingJob);

        // If completed or error, fetch entity counts
        if (jobData.status === "completed" || jobData.status === "error") {
          await fetchEntityCounts();
          
          if (jobData.status === "completed" && onComplete) {
            onComplete();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching job status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntityCounts = async () => {
    try {
      const [charsRes, locsRes, evtsRes, objsRes] = await Promise.all([
        supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .eq("universe_id", universeId),
        supabase
          .from("locations")
          .select("*", { count: "exact", head: true })
          .eq("universe_id", universeId),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("universe_id", universeId),
        supabase
          .from("objects")
          .select("*", { count: "exact", head: true })
          .eq("universe_id", universeId),
      ]);

      setCounts({
        characters: charsRes.count || 0,
        locations: locsRes.count || 0,
        events: evtsRes.count || 0,
        objects: objsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching entity counts:", error);
    }
  };

  const getStatusIcon = () => {
    if (!job) return null;

    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      case "processing":
      case "pending":
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!job) return "Carregando...";

    switch (job.status) {
      case "completed":
        return "Extração Concluída!";
      case "error":
        return "Erro na Extração";
      case "processing":
        return "Processando...";
      case "pending":
        return "Aguardando...";
      default:
        return job.status;
    }
  };

  const getStatusColor = () => {
    if (!job) return "text-gray-600";

    switch (job.status) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "processing":
      case "pending":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading && !job) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-lumen-navy" />
          <span className="ml-3 text-lumen-navy">Carregando status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h3 className={`text-2xl font-serif font-bold ${getStatusColor()}`}>
                {getStatusText()}
              </h3>
              {job?.current_step && (
                <p className="text-sm text-muted-foreground mt-1">{job.current_step}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-lumen-navy">{job?.progress || 0}%</div>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={job?.progress || 0} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {job?.status === "processing" && "Tempo estimado: 2-5 minutos"}
            {job?.status === "completed" && "Processamento concluído com sucesso"}
            {job?.status === "error" && "Ocorreu um erro durante o processamento"}
          </p>
        </div>

        {/* Error Message */}
        {job?.status === "error" && job.error_message && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Erro:</strong> {job.error_message}
            </p>
          </div>
        )}

        {/* Entity Counts */}
        {(job?.status === "completed" || (job?.status === "processing" && job.progress > 60)) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{counts.characters}</div>
              <div className="text-xs text-gray-600">Personagens</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{counts.locations}</div>
              <div className="text-xs text-gray-600">Locais</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{counts.events}</div>
              <div className="text-xs text-gray-600">Eventos</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{counts.objects}</div>
              <div className="text-xs text-gray-600">Objetos</div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {job?.status === "completed" && (
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/universe/${universeId}`)}
              className="flex-1 bg-lumen-navy hover:bg-lumen-navy/90 text-white"
            >
              Ver Universo
            </Button>
            <Button
              onClick={() => navigate("/admin/universes")}
              variant="outline"
              className="flex-1"
            >
              Voltar para Lista
            </Button>
          </div>
        )}

        {/* Processing Steps Timeline */}
        {job?.status === "processing" && (
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="font-semibold text-sm text-lumen-navy mb-3">Etapas do Processamento:</h4>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${job.progress >= 10 ? "text-green-600" : "text-gray-400"}`}>
                {job.progress >= 10 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                <span>Arquivo validado</span>
              </div>
              <div className={`flex items-center gap-2 ${job.progress >= 30 ? "text-green-600" : job.progress >= 20 ? "text-blue-600" : "text-gray-400"}`}>
                {job.progress >= 30 ? <CheckCircle2 className="w-4 h-4" /> : job.progress >= 20 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                <span>Extraindo texto do PDF</span>
              </div>
              <div className={`flex items-center gap-2 ${job.progress >= 60 ? "text-green-600" : job.progress >= 40 ? "text-blue-600" : "text-gray-400"}`}>
                {job.progress >= 60 ? <CheckCircle2 className="w-4 h-4" /> : job.progress >= 40 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                <span>Extraindo entidades com IA</span>
              </div>
              <div className={`flex items-center gap-2 ${job.progress >= 80 ? "text-green-600" : job.progress >= 70 ? "text-blue-600" : "text-gray-400"}`}>
                {job.progress >= 80 ? <CheckCircle2 className="w-4 h-4" /> : job.progress >= 70 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                <span>Criando entidades no banco de dados</span>
              </div>
              <div className={`flex items-center gap-2 ${job.progress >= 100 ? "text-green-600" : job.progress >= 90 ? "text-blue-600" : "text-gray-400"}`}>
                {job.progress >= 100 ? <CheckCircle2 className="w-4 h-4" /> : job.progress >= 90 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                <span>Finalizando</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};