import { Book, Users, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UniverseCardProps {
  name: string;
  description: string;
  characterCount: number;
  locationCount: number;
  bookCount: number;
  imageUrl?: string;
  onClick?: () => void;
}

export const UniverseCard = ({
  name,
  description,
  characterCount,
  locationCount,
  bookCount,
  imageUrl,
  onClick,
}: UniverseCardProps) => {
  return (
    <Card
      className="group cursor-pointer hover-glow bg-card border-border overflow-hidden transition-all duration-300"
      onClick={onClick}
    >
      {/* Image Header */}
      {imageUrl && (
        <div className="h-48 overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif text-2xl font-semibold text-foreground mb-2 decorative-line pb-2">
          {name}
        </h3>

        <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
          {description}
        </p>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Book className="w-4 h-4 text-lumen-glow" />
            <span>{bookCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4 text-lumen-glow" />
            <span>{characterCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-4 h-4 text-lumen-glow" />
            <span>{locationCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
