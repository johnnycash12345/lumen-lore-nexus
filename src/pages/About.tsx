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
    <div className="min-h-screen bg-background relative">
      <DecorativeDots />
      <NavigationBar />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">
            Sobre o Lumen
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A Enciclopédia Interativa Multiagente de Universos Narrativos que vai além da
            Wikipédia, oferecendo análises profundas e conversações com seus mundos favoritos.
          </p>
        </div>

        {/* Mission */}
        <Card className="p-8 md:p-12 mb-16">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-6 text-center">
            Nossa Missão
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            O Lumen nasceu da paixão por histórias e da vontade de criar uma ferramenta que
            permitisse aos fãs explorar seus universos favoritos de forma mais profunda e
            interativa.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Não queremos apenas listar fatos sobre personagens e eventos. Queremos conectar,
            analisar e dar vida à narrativa através da inteligência artificial, oferecendo
            insights que vão muito além do que uma enciclopédia tradicional pode oferecer.
          </p>
        </Card>

        {/* Features */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">
            O Que Nos Diferencia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-lumen-glow/10 rounded-lg">
                      <Icon className="w-6 h-6 text-lumen-navy" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technology */}
        <Card className="p-8 md:p-12 mb-16 bg-lumen-navy text-white">
          <h2 className="font-serif text-3xl font-bold mb-6 text-center">Tecnologia</h2>
          <div className="space-y-4 text-lg">
            <p className="leading-relaxed">
              O Lumen utiliza modelos de linguagem avançados como <strong>Deepseek</strong> e{" "}
              <strong>GPT</strong> para processar e extrair informações de livros, filmes,
              séries e jogos.
            </p>
            <p className="leading-relaxed">
              Nossa infraestrutura é construída sobre <strong>React</strong>,{" "}
              <strong>TypeScript</strong> e <strong>Supabase</strong>, garantindo uma
              experiência rápida, segura e escalável.
            </p>
          </div>
        </Card>

        {/* Team */}
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
            Criado com Paixão
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O Lumen é um projeto em constante evolução, desenvolvido por entusiastas de
            literatura, cinema e tecnologia que acreditam no poder das histórias.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-20">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}