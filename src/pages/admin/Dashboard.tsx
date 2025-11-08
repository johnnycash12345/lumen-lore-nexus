import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Book, Users, MapPin, Calendar, FileText, CheckCircle2 } from "lucide-react";

interface Stats {
  totalUniverses: number;
  totalCharacters: number;
  totalLocations: number;
  totalEvents: number;
  totalProcessed: number;
  successRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUniverses: 0,
    totalCharacters: 0,
    totalLocations: 0,
    totalEvents: 0,
    totalProcessed: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [universesRes, charactersRes, locationsRes, eventsRes, jobsRes] = await Promise.all([
        supabase.from("universes").select("*", { count: "exact", head: true }),
        supabase.from("characters").select("*", { count: "exact", head: true }),
        supabase.from("locations").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("processing_jobs").select("status"),
      ]);

      const completed = jobsRes.data?.filter((j) => j.status === "completed").length || 0;
      const total = jobsRes.data?.length || 0;

      setStats({
        totalUniverses: universesRes.count || 0,
        totalCharacters: charactersRes.count || 0,
        totalLocations: locationsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalProcessed: completed,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Universos",
      value: stats.totalUniverses,
      icon: Book,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total de Personagens",
      value: stats.totalCharacters,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total de Locais",
      value: stats.totalLocations,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Eventos",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "PDFs Processados",
      value: stats.totalProcessed,
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.successRate}%`,
      icon: CheckCircle2,
      color: stats.successRate > 90 ? "text-green-600" : stats.successRate > 70 ? "text-yellow-600" : "text-red-600",
      bgColor: stats.successRate > 90 ? "bg-green-50" : stats.successRate > 70 ? "bg-yellow-50" : "bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-navy">{card.value}</p>
                </div>
                <div className={`${card.bgColor} ${card.color} p-4 rounded-full`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}