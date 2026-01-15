import { useEffect, useState } from "react";
import { User as UserIcon, Calendar, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    const supabase = createSupabaseClientForAuth();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("supabase") || e.key?.includes("sb-")) {
        checkSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("scroll", handleScroll);
    updatePath();

    const handlePopState = () => {
      updatePath();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href) {
        setTimeout(updatePath, 50);
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (loading) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-12">
            <a
              href="/"
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              {!user && (
                <span className="text-xl font-bold text-foreground">
                  Home Planner
                </span>
              )}
            </a>

            {!user && (
              <div className="hidden lg:flex items-center gap-8">
                <a
                  href="#features"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Testimonials
                </a>
              </div>
            )}

            {user && (
              <div className="hidden lg:flex items-center gap-2">
                <a
                  href="/calendar/week"
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/calendar")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  Calendar
                  {currentPath.startsWith("/calendar") && (
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 animate-shimmer" />
                  )}
                </a>
                <a
                  href="/family/overview"
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/family")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  Family
                  {currentPath.startsWith("/family") && (
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 animate-shimmer" />
                  )}
                </a>
                <a
                  href="/settings/calendars"
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/settings")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  Settings
                  {currentPath.startsWith("/settings") && (
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 animate-shimmer" />
                  )}
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <a
                  href="/profile/me"
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentPath.startsWith("/profile")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 shadow-lg shadow-primary/10"
                      : "bg-card/50 border border-border hover:border-primary/50"
                  }`}
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground max-w-[150px] truncate">
                    {user.email}
                  </span>
                </a>
                <a
                  href="/profile/me"
                  className="sm:hidden"
                  aria-label="Profile"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground"
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </a>
                <LogoutButton variant="outline" size="sm" />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-foreground hover:text-primary"
                >
                  <a href="/auth/login">Sign In</a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                >
                  <a href="/auth/login">Get Started</a>
                </Button>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 space-y-4">
            {!user ? (
              <>
                <a
                  href="#features"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </a>
              </>
            ) : (
              <>
                <a
                  href="/calendar/week"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/calendar")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calendar
                </a>
                <a
                  href="/family/overview"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/family")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Family
                </a>
                <a
                  href="/settings/calendars"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/settings")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </a>
                <a
                  href="/profile/me"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath.startsWith("/profile")
                      ? "glass-effect bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
