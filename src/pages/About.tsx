import { NavigationBar } from "@/components/NavigationBar";
import { DecorativeDots } from "@/components/DecorativeDots";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles, Database, MessageSquare } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description:
        "Utilizamos modelos avançados de IA para extrair e analisar entidades narrativas de forma automática e profunda.",
    },
    {
      icon: Database,
      title: "Banco de Dados Estruturado",
      description:
        "Todos os dados são organizados em um banco de dados relacional, permitindo conexões e análises complexas.",
    },
    {
      icon: Sparkles,
      title: "Análise Canônica",
      description:
        "Cada personagem, local e evento é analisado considerando o cânone oficial do universo narrativo.",
    },
    {
      icon: MessageSquare,
      title: "Conversas Interativas",
      description:
        "Dialogue com personagens e explore universos de forma conversacional e natural.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DecorativeDots />
      <NavigationBar />

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4">
            Sobre o Lumen
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A enciclopédia interativa que vai além da Wikipédia
          </p>
        </div>

        {/* Mission */}
        <Card className="p-8 mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 text-center">
            Nossa Missão
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            O Lumen nasceu da paixão por histórias e da vontade de criar uma ferramenta que
            permitisse aos fãs explorar seus universos favoritos de forma mais profunda.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Queremos conectar, analisar e dar vida à narrativa através da IA, oferecendo
            insights que vão além do que uma enciclopédia tradicional pode oferecer.
          </p>
        </Card>

        {/* Features */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">
            O Que Nos Diferencia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-lumen-glow/10 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-lumen-navy" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technology */}
        <Card className="p-8 mb-12 bg-lumen-navy text-white">
          <h2 className="font-serif text-2xl font-bold mb-4 text-center">Tecnologia</h2>
          <div className="space-y-3">
            <p className="leading-relaxed">
              O Lumen utiliza <strong>Deepseek</strong> e <strong>GPT</strong> para processar 
              e extrair informações de livros, filmes, séries e jogos.
            </p>
            <p className="leading-relaxed">
              Nossa infraestrutura: <strong>React</strong>, <strong>TypeScript</strong> e{" "}
              <strong>Supabase</strong>.
            </p>
          </div>
        </Card>

        {/* Team */}
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Criado com Paixão
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Projeto em constante evolução, desenvolvido por entusiastas de literatura, 
            cinema e tecnologia que acreditam no poder das histórias.
          </p>
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