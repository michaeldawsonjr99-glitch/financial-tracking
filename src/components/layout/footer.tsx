export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-left text-xs text-muted-foreground">
            © 2026 Finance Tracker. All rights reserved.
          </span>
          <span className="text-right text-xs text-muted-foreground/80">
            Built by AJDev · Next.js, Prisma &amp; Tailwind CSS
          </span>
        </div>
      </div>
    </footer>
  );
}