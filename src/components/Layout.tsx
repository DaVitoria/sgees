import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, BookOpen, User, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();

  // Definir navegação baseada no role do usuário
  const getNavigationItems = () => {
    const baseNav = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "secretario", "professor", "aluno", "funcionario", "tesoureiro"] }
    ];

    const adminNav = [
      { name: "Administrativo", href: "/administrativo", icon: GraduationCap, roles: ["admin", "secretario"] },
      { name: "Pedagógico", href: "/pedagogico", icon: BookOpen, roles: ["admin", "secretario", "professor"] },
    ];

    const alunoNav = [
      { name: "Portal do Aluno", href: "/aluno", icon: User, roles: ["aluno"] },
    ];

    const allItems = [...baseNav, ...adminNav, ...alunoNav];
    return allItems.filter(item => !userRole || item.roles.includes(userRole));
  };

  const navigation = getNavigationItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sistema Escolar</h1>
                <p className="text-xs text-muted-foreground">Gestão Educacional</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
