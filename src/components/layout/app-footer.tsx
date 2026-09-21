export function AppFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border mt-auto py-6 px-4 md:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">
            &copy; {currentYear} codeWithFarhan. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
          <p>
            Website designed and maintained by Farhan Sadik.
          </p>
          <a 
            href="https://www.farhansadik.me/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-foreground transition-colors duration-200"
          >
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
}

