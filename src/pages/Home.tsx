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
      <section className="relative py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            LUMEN
          </h1>
          
          <p className="font-serif text-lg sm:text-xl md:text-2xl text-foreground/80 mb-12 md:mb-16 px-4">
            Converse com universos inteiros.
          </p>

          {/* Universe Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {UNIVERSES.map((universe) => {
              const Icon = universe.icon;
              return (
                <button
                  key={universe.id}
                  onClick={() => navigate(`/universe/${universe.id}`)}
                  className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 text-left active:scale-95 min-h-[240px] sm:min-h-[280px]"
                >
                  {/* Icon */}
                  <div className="flex flex-col items-center mb-4 md:mb-6">
                    <Icon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-lumen-navy stroke-[1.5] mb-3 md:mb-4" />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 opacity-20">
                      <Icon className="w-full h-full text-lumen-glow stroke-1" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-2 md:mb-3 text-center">
                    {universe.name}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
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
      <footer className="border-t border-border py-6 md:py-8 px-4 mt-12 md:mt-20">
        <div className="container mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}
