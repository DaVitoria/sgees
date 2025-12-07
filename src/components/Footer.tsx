import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Contactos */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h4 className="font-semibold text-foreground mb-1">Contactos</h4>
            <a 
              href="mailto:info@escola.edu.mz" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              info@escola.edu.mz
            </a>
            <a 
              href="tel:+258841234567" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              +258 84 123 4567
            </a>
          </div>

          {/* Endereço */}
          <div className="flex flex-col items-center gap-2">
            <h4 className="font-semibold text-foreground mb-1">Endereço</h4>
            <div className="flex items-start gap-2 text-sm text-muted-foreground text-center">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Av. Eduardo Mondlane, Nº 123<br />Maputo, Moçambique</span>
            </div>
          </div>

          {/* Horário */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <h4 className="font-semibold text-foreground mb-1">Horário</h4>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              Segunda a Sexta<br />07:00 - 17:00
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear}{" "}
            <a
              href="https://github.com/DaVitoria"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Clands
            </a>
            . Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
