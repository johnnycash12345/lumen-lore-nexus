import { Logo } from "./Logo";
import { useLocation, Link } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Início", path: "/" },
  { label: "Universos", path: "/universes" },
  { label: "Personagens", path: "/characters" },
  { label: "Linha do Tempo", path: "/timeline" },
  { label: "Sobre", path: "/about" },
];

export const NavigationBar = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <Logo showText variant="compact" animate={false} />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "text-foreground active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu - Simplified for now */}
          <div className="md:hidden">
            <button className="text-muted-foreground">
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
