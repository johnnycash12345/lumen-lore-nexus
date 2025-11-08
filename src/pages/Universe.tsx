import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavigationBar } from "@/components/NavigationBar";
import { DecorativeDots } from "@/components/DecorativeDots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Universe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("biografia");

  // Demo data
  const universeData = {
    sherlock: {
      name: "Sherlock Holmes",
      characters: [
        { 
          id: "holmes", 
          name: "Sherlock Holmes", 
          role: "Protagonista",
          initials: "SH",
          bio: "Diin me liolum cohei effidoem com haibem, que cennpriods Wlatod que de cem eniar mnklus mdisde genmant, slunom lurile.",
        },
        { 
          id: "watson", 
          name: "Dr. Watson", 
          role: "Narrador",
          initials: "JW",
          bio: "The tremda clae Raem dor curs de les pethom pues. Dne cli trave hesn an tueiluisda miderde. Map",
        },
        { 
          id: "moriarty", 
          name: "Professor Moriarty", 
          role: "Antagonista",
          initials: "PM",
          bio: "Un lem natem the sie naperta a gnel de tiecan. Wateson, dcas etol om leagp aniftma comars, Ia lneti sle de Cornn.",
        },
      ],
    },
  };

  const currentUniverse = universeData[id as keyof typeof universeData];

  if (!currentUniverse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Universo não encontrado</h1>
        </div>
      </div>
    );
  }

  const selectedCharacter = currentUniverse.characters[0]; // Default to first character

  return (
    <div className="min-h-screen bg-background relative">
      <DecorativeDots />
      <NavigationBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Character List */}
          <aside className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold mb-4 text-foreground">
                Personagens
              </h2>
              <div className="space-y-3">
                {currentUniverse.characters.map((char) => (
                  <button
                    key={char.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <Avatar className="w-10 h-10 border-2 border-lumen-glow/30">
                      <AvatarFallback className="bg-lumen-navy text-primary-foreground font-semibold text-sm">
                        {char.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {char.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {char.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Character Detail */}
          <main className="lg:col-span-6">
            <div className="bg-card border border-border rounded-lg p-8">
              {/* Character Header */}
              <div className="flex items-center gap-4 mb-8">
                <Avatar className="w-20 h-20 border-4 border-lumen-glow/30">
                  <AvatarFallback className="bg-lumen-navy text-primary-foreground font-bold text-2xl">
                    {selectedCharacter.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-serif text-4xl font-bold text-foreground">
                    {selectedCharacter.name}
                  </h1>
                  <p className="text-muted-foreground">{selectedCharacter.role}</p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-secondary/50 mb-6">
                  <TabsTrigger value="biografia">Biografia</TabsTrigger>
                  <TabsTrigger value="aparicoes">Aparições</TabsTrigger>
                  <TabsTrigger value="restricoes">Restrições</TabsTrigger>
                  <TabsTrigger value="relacoes">Relações</TabsTrigger>
                  <TabsTrigger value="perspectivas">Perspectivas do Lumen</TabsTrigger>
                </TabsList>

                <TabsContent value="biografia" className="space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">
                      Biografía
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                        <p>{selectedCharacter.bio}</p>
                        <p>Tin oseld ipcamt de dode de cem portails neitax ends neislam an fooutherno de nditer etn reens. Anclin netausec. Dont etos te. Gexw ne uan. Tams, de linke prindfse sone.</p>
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                        <p>Urcx lato fiust, ma Shayents me alicito pariettin torpso plern lafuls, ckeluts de peus exa tquiromdo dotitś inles.</p>
                        <p>Ye euslm ipsonn plur vanis tegllug es pra.mb, iperste dona eloxs s droperetne the flinan eta stariorre glrmlse lie.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">
                      Aparições
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        <p>Un lem natem the sie naperta a gnel de tiecan. Wateson, dcas etol om leagp aniftma comars, Ia lneti sle de Cornn. Tmnleure den ea coetst. Lame ele per s emes nulus rituralby fitaluta oulica laudongoten sli uspelas.</p>
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        <p>Der nuclepto olurtmeiven Mlatson diftios rum, em colm ei leagp etuir pientei heycluta a ilher aa prolese cea euuperfinan ide gäre que dai slimrogue tarchure de eam sticiodudi Detrataal que alinse do de bum.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="aparicoes">
                  <p className="text-muted-foreground">Conteúdo de Aparições em desenvolvimento...</p>
                </TabsContent>

                <TabsContent value="restricoes">
                  <p className="text-muted-foreground">Conteúdo de Restrições em desenvolvimento...</p>
                </TabsContent>

                <TabsContent value="relacoes">
                  <p className="text-muted-foreground">Conteúdo de Relações em desenvolvimento...</p>
                </TabsContent>

                <TabsContent value="perspectivas">
                  <p className="text-muted-foreground">Conteúdo de Perspectivas em desenvolvimento...</p>
                </TabsContent>
              </Tabs>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3">
            <div className="space-y-6">
              {/* Biogema */}
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h3 className="font-serif text-lg font-semibold mb-4 text-foreground">
                  Biogema
                </h3>
                <div className="relative h-48 flex items-center justify-center">
                  <div className="text-sm text-muted-foreground text-center">
                    Mapa de Relações
                    <br />
                    <span className="text-xs">(Em desenvolvimento)</span>
                  </div>
                </div>
              </div>

              {/* Perspectivas */}
              <div className="bg-secondary/30 border border-border rounded-lg p-6">
                <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">
                  Perspectivas do Lumen
                </h3>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  Um noe Fquondtur Daltus ee mde quese pla paseiception elardurs do elie tiecas eulos do eus revlten.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
