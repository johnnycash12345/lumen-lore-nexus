import { NavigationBar } from "@/components/NavigationBar";
import { DecorativeDots } from "@/components/DecorativeDots";
import { useNavigate } from "react-router-dom";
import { Search, Wand2, Castle } from "lucide-react";

const UNIVERSES = [
  {
    id: "sherlock",
    name: "Sherlock Holmes",
    description: "Enter the world of deduction. Explore cases, characters, and London's mysteries.",
    icon: Search,
  },
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "The wizarding world awaits. Discover spells, creatures, ad Hogwarts.",
    icon: Wand2,
  },
  {
    id: "lotr",
    name: "O Senhor dos Anéis",
    description: "Journey to Middle-earth. Maps, lore, and the Feleowship's quest.",
    icon: Castle,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <DecorativeDots />
      <NavigationBar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Title */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4">
              LUMEN
            </h1>
            <p className="font-serif text-xl md:text-2xl text-foreground/70">
              Converse com universos inteiros.
            </p>
          </div>

          {/* Universe Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {UNIVERSES.map((universe) => {
              const Icon = universe.icon;
              return (
                <button
                  key={universe.id}
                  onClick={() => navigate(`/universe/${universe.id}`)}
                  className="group bg-card border border-border rounded-xl p-6 hover:shadow-elegant transition-all duration-200 hover:-translate-y-1 text-center"
                >
                  <Icon className="w-12 h-12 text-lumen-navy mx-auto mb-4 stroke-[1.5]" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {universe.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {universe.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}
