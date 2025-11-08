import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Universe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // Demo data
  const universeData = {
    sherlock: {
      name: "Sherlock Holmes",
      characters: [
        { id: "holmes", name: "Sherlock Holmes", role: "Protagonista" },
        { id: "watson", name: "Dr. Watson", role: "Narrador" },
        { id: "moriarty", name: "Professor Moriarty", role: "Antagonista" },
        { id: "lestrade", name: "Inspector Lestrade", role: "Coadjuvante" },
      ],
      locations: [
        { id: "baker", name: "221B Baker Street" },
        { id: "scotland", name: "Scotland Yard" },
        { id: "reichenbach", name: "Cataratas de Reichenbach" },
      ],
    },
  };

  const currentUniverse = universeData[id as keyof typeof universeData];

  if (!currentUniverse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Universo não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const CatalogContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">Personagens</h3>
        <div className="space-y-2">
          {currentUniverse.characters.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedCharacter === char.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted border border-border"
              }`}
            >
              <div className="font-medium">{char.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{char.role}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">Locais</h3>
        <div className="space-y-2">
          {currentUniverse.locations.map((loc) => (
            <button
              key={loc.id}
              className="w-full text-left px-4 py-3 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
            >
              <div className="font-medium">{loc.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Logo showText={false} animate />
              <div>
                <h1 className="font-serif text-xl font-semibold text-foreground">
                  {currentUniverse.name}
                </h1>
                <p className="text-sm text-muted-foreground font-mono">Universo Narrativo</p>
              </div>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="py-6">
                  <h2 className="font-serif text-2xl font-bold mb-6">Catálogo</h2>
                  <CatalogContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <h2 className="font-serif text-xl font-bold mb-4">Catálogo</h2>
                <CatalogContent />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="md:col-span-9 lg:col-span-10">
            <div className="h-[calc(100vh-180px)]">
              <ChatInterface />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
