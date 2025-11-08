import { Hexagon } from "lucide-react";

export interface LogoProps {
  className?: string;
  showText?: boolean;
  animate?: boolean;
  variant?: "default" | "compact";
}

export const Logo = ({ 
  className = "", 
  showText = true, 
  animate = true,
  variant = "default" 
}: LogoProps) => {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`relative ${animate ? 'logo-pulse' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-lumen-navy flex items-center justify-center border border-lumen-glow/30">
            <Hexagon className="w-4 h-4 text-lumen-glow fill-lumen-glow/30" strokeWidth={2} />
          </div>
        </div>
        {showText && (
          <span className="font-serif text-xl font-semibold tracking-wider text-foreground">
            LUMEN
          </span>
        )}
      </div>
    );
  }

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
