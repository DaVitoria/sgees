import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, BookOpen, User, LogOut, UserCircle, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import Footer from "@/components/Footer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Definir navegação baseada no role do usuário
  const getNavigationItems = () => {
    const baseNav = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "secretario", "professor", "aluno", "funcionario", "tesoureiro"] }
    ];

    const adminNav = [
      { name: "Administrativo", href: "/administrativo", icon: GraduationCap, roles: ["admin", "secretario", "funcionario"] },
      { name: "Pedagógico", href: "/pedagogico", icon: BookOpen, roles: ["admin", "secretario", "professor", "funcionario"] },
    ];

    const alunoNav = [
      { name: "Portal do Aluno", href: "/aluno", icon: User, roles: ["aluno"] },
    ];

    const allItems = [...baseNav, ...adminNav, ...alunoNav];
    // Se não tiver role, mostrar apenas Dashboard
    if (!userRole) {
      return baseNav;
    }
    return allItems.filter(item => item.roles.includes(userRole));
  };

  const navigation = getNavigationItems();
  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - sempre visível */}
            <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Sistema Escolar</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Gestão Educacional</p>
              </div>
            </Link>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <NotificationBell />
              <Link to="/perfil">
                <Button variant="ghost" size="sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1">
              <NotificationBell />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                  <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-foreground">Menu</h2>
                          <p className="text-xs text-muted-foreground">Navegação</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Navigation Links */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                      {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                              active 
                                ? "bg-primary text-primary-foreground" 
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Mobile Menu Footer */}
                    <div className="p-4 border-t border-border space-y-2">
                      <Link to="/perfil" onClick={handleNavClick}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <UserCircle className="h-4 w-4" />
                          Perfil
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          handleNavClick();
                          signOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-2 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16 px-2">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1 ${
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 truncate max-w-full">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full pb-20 md:pb-8">
        {children}
      </main>

      {/* Footer - hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
