import { useState } from "react";
import { Logo } from "./Logo";
import { useLocation, Link } from "react-router-dom";
import { Menu, X, Home, Book, Info, HelpCircle, LogIn } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Início", path: "/", icon: Home },
  { label: "Universos", path: "/universes", icon: Book },
  { label: "Como Funciona", path: "/how-it-works", icon: HelpCircle },
  { label: "Sobre", path: "/about", icon: Info },
  { label: "Login", path: "/auth", icon: LogIn },
];

export const NavigationBar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo showText variant="compact" animate={false} />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link text-sm font-medium transition-colors hover:scale-105 ${
                  location.pathname === item.path
                    ? "text-foreground active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] px-0">
              <div className="px-6 py-4 border-b">
                <Logo showText variant="compact" animate={false} />
              </div>
              <nav className="flex flex-col py-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 text-base font-medium transition-colors ${
                        isActive
                          ? "text-foreground bg-muted border-l-4 border-lumen-navy"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
