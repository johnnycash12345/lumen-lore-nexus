import { NavigationBar } from "@/components/NavigationBar";
import { DecorativeDots } from "@/components/DecorativeDots";
import { Card } from "@/components/ui/card";
import { Upload, Brain, Database, Sparkles, MessageSquare, CheckCircle } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "1. Upload de Conteúdo",
      description:
        "Administradores fazem upload de PDFs de livros ou documentos sobre o universo narrativo.",
    },
    {
      icon: Brain,
      title: "2. Processamento com IA",
      description:
        "A inteligência artificial analisa o texto e extrai automaticamente personagens, locais, eventos e objetos.",
    },
    {
      icon: Database,
      title: "3. Estruturação de Dados",
      description:
        "Todas as entidades extraídas são organizadas em um banco de dados relacional com relacionamentos complexos.",
    },
    {
      icon: Sparkles,
      title: "4. Análise Canônica",
      description:
        "O sistema analisa motivações, relacionamentos e significâncias dentro do contexto do universo.",
    },
    {
      icon: MessageSquare,
      title: "5. Exploração Interativa",
      description:
        "Usuários podem conversar, explorar e descobrir insights profundos sobre o universo.",
    },
    {
      icon: CheckCircle,
      title: "6. Atualização Contínua",
      description:
        "Novos conteúdos podem ser adicionados continuamente, expandindo o universo disponível.",
    },
  ];

  const capabilities = [
    {
      title: "Extração de Personagens",
      items: [
        "Nome e aliases",
        "Descrição detalhada",
        "Papel no universo",
        "Habilidades e poderes",
        "Personalidade e ocupação",
      ],
    },
    {
      title: "Mapeamento de Locais",
      items: [
        "Nome e tipo de local",
        "Descrição geográfica",
        "País ou região",
        "Significância no universo",
        "Eventos relacionados",
      ],
    },
    {
      title: "Cronologia de Eventos",
      items: [
        "Nome e data do evento",
        "Descrição detalhada",
        "Personagens envolvidos",
        "Local onde ocorreu",
        "Impacto na narrativa",
      ],
    },
    {
      title: "Catálogo de Objetos",
      items: [
        "Nome e tipo",
        "Poderes especiais",
        "Proprietário atual",
        "História do objeto",
        "Relevância narrativa",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DecorativeDots />
      <NavigationBar />

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4">
            Como Funciona
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformamos textos em universos interativos
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-8 text-center">
            O Processo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="p-5 hover:shadow-elegant transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-lumen-glow/10 rounded-full mb-3">
                      <Icon className="w-6 h-6 text-lumen-navy" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* What We Extract */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-8 text-center">
            O Que Extraímos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((capability) => (
              <Card key={capability.title} className="p-5">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
                  {capability.title}
                </h3>
                <ul className="space-y-1.5">
                  {capability.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-lumen-navy flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="p-8 bg-lumen-navy text-white mb-12">
          <h2 className="font-serif text-2xl font-bold mb-5 text-center">
            Tecnologias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-serif text-lg font-semibold mb-2">Inteligência Artificial</h3>
              <ul className="space-y-1">
                <li>• Deepseek (processamento principal)</li>
                <li>• GPT-4 (análises complexas)</li>
                <li>• Claude (compreensão contextual)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold mb-2">Infraestrutura</h3>
              <ul className="space-y-1">
                <li>• React + TypeScript</li>
                <li>• Supabase (banco de dados)</li>
                <li>• Edge Functions (processamento)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Pronto para Explorar?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Descubra universos analisados profundamente por IA
          </p>
          <a
            href="/universes"
            className="inline-block px-6 py-3 bg-lumen-navy text-white font-serif rounded-lg hover:bg-lumen-navy/90 transition-colors"
          >
            Ver Universos
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}