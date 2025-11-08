import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ChatInterface } from "@/components/ChatInterface";
import { UniverseCard } from "@/components/UniverseCard";
import { Button } from "@/components/ui/button";
import { MessageSquare, Upload, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_UNIVERSES = [
  {
    id: "sherlock",
    name: "Sherlock Holmes",
    description: "O universo do detetive mais famoso do mundo, criado por Arthur Conan Doyle. Explore os mistérios da Londres vitoriana através da mente brilhante de Holmes.",
    characterCount: 42,
    locationCount: 18,
    bookCount: 4,
    imageUrl: "https://images.unsplash.com/photo-1544716278-e513176f20b5?w=800&q=80",
  },
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "O mundo mágico criado por J.K. Rowling. Descubra Hogwarts, seus personagens e a luta entre o bem e o mal através de diferentes perspectivas.",
    characterCount: 156,
    locationCount: 47,
    bookCount: 7,
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  },
  {
    id: "lotr",
    name: "Senhor dos Anéis",
    description: "A Terra-média de J.R.R. Tolkien. Viva a jornada épica através dos olhos de elfos, hobbits, homens e magos.",
    characterCount: 89,
    locationCount: 34,
    bookCount: 3,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  },
];

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo animate />
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar Universo</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="font-mono">Powered by AI</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Viva as Histórias<br />
            <span className="text-lumen-glow">de Dentro</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore universos narrativos através da perspectiva dos personagens. 
            Uma experiência imersiva com análise canônica profunda.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="gap-2">
              <MessageSquare className="w-5 h-5" />
              Começar Exploração
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Upload className="w-5 h-5" />
              Importar Seu Universo
            </Button>
          </div>
        </div>
      </section>

      {/* Chat Interface (conditional) */}
      {showChat && (
        <section className="px-4 pb-12">
          <div className="container mx-auto max-w-4xl">
            <div className="h-[500px]">
              <ChatInterface />
            </div>
          </div>
        </section>
      )}

      {/* Universes Grid */}
      <section className="py-12 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              Universos Disponíveis
            </h2>
            <p className="text-muted-foreground">
              Explore mundos narrativos já mapeados pela comunidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_UNIVERSES.map((universe) => (
              <UniverseCard
                key={universe.id}
                {...universe}
                onClick={() => navigate(`/universe/${universe.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">
              Além da Enciclopédia
            </h2>
            <p className="text-xl text-muted-foreground">
              O Lumen oferece uma experiência única de exploração narrativa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-lumen-glow" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Perspectivas Múltiplas</h3>
              <p className="text-muted-foreground">
                Viva os eventos através dos olhos de diferentes personagens
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-lumen-glow" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Análise Canônica</h3>
              <p className="text-muted-foreground">
                Respeito total ao material original e coerência narrativa
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-lumen-glow" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Chat Interativo</h3>
              <p className="text-muted-foreground">
                Converse com a IA como se estivesse dialogando com os personagens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <Logo className="justify-center mb-4" animate={false} />
          <p className="font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}
