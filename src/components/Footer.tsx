const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
    </footer>
  );
};

export default Footer;
