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
    <div className="min-h-screen bg-background relative">
      <DecorativeDots />
      
      <NavigationBar />

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6">
            LUMEN
          </h1>
          
          <p className="font-serif text-xl md:text-2xl text-foreground/80 mb-16">
            Converse com universos inteiros.
          </p>

          {/* Universe Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {UNIVERSES.map((universe) => {
              const Icon = universe.icon;
              return (
                <button
                  key={universe.id}
                  onClick={() => navigate(`/universe/${universe.id}`)}
                  className="group relative bg-card border border-border rounded-2xl p-8 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 text-left"
                >
                  {/* Icon */}
                  <div className="flex flex-col items-center mb-6">
                    <Icon className="w-16 h-16 text-lumen-navy stroke-[1.5] mb-4" />
                    <div className="w-12 h-12 opacity-20">
                      <Icon className="w-full h-full text-lumen-glow stroke-1" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-3 text-center">
                    {universe.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {universe.description}
                  </p>

                  {/* Decorative dots on card */}
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-lumen-glow/60" />
                  <div className="absolute bottom-6 left-6 w-1 h-1 rounded-full bg-lumen-glow/40" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

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
