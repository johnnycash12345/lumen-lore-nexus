import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Users, MapPin, Calendar, FileText, CheckCircle2, TrendingUp, Activity, Upload, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-navy mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema</p>
        </div>
        <Link to="/admin/upload">
          <Button className="bg-navy hover:bg-navy/90">
            <FileText className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-navy">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} ${card.color} p-4 rounded-full`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Novo universo criado</p>
                  <p className="text-xs text-gray-500">Harry Potter - 1234 entidades extraídas</p>
                  <p className="text-xs text-gray-400 mt-1">Há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">PDF processado</p>
                  <p className="text-xs text-gray-500">O Senhor dos Anéis - Processamento completo</p>
                  <p className="text-xs text-gray-400 mt-1">Há 5 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Backup realizado</p>
                  <p className="text-xs text-gray-500">Backup automático concluído com sucesso</p>
                  <p className="text-xs text-gray-400 mt-1">Há 1 dia</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Sucesso</span>
                  <span className="font-semibold">{stats.successRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.successRate}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Processamento em Andamento</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Uso de Armazenamento</span>
                  <span className="font-semibold">1.77 GB / 10 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '17.7%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/upload">
              <Button variant="outline" className="w-full h-auto flex-col py-6">
                <Upload className="w-8 h-8 mb-2" />
                <span>Upload PDF</span>
              </Button>
            </Link>
            <Link to="/admin/universes">
              <Button variant="outline" className="w-full h-auto flex-col py-6">
                <Book className="w-8 h-8 mb-2" />
                <span>Ver Universos</span>
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full h-auto flex-col py-6">
                <Settings className="w-8 h-8 mb-2" />
                <span>Configurações</span>
              </Button>
            </Link>
            <Link to="/admin/profile">
              <Button variant="outline" className="w-full h-auto flex-col py-6">
                <User className="w-8 h-8 mb-2" />
                <span>Meu Perfil</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}