import { Hexagon } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  animate?: boolean;
}

export const Logo = ({ className = "", showText = true, animate = true }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${animate ? 'logo-pulse' : ''}`}>
        <Hexagon 
          className="w-10 h-10 text-lumen-glow fill-lumen-glow/20" 
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-lumen-glow" />
        </div>
      </div>
      {showText && (
        <span className="font-serif text-2xl font-semibold tracking-wider text-foreground">
          LUMEN
        </span>
      )}
    </div>
  );
};
