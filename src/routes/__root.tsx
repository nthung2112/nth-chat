import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

export const metadata = {
  title: "NTH Chat",
  description: "A chat application built with React and TanStack Router",
};

function RootComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex h-full w-full flex-col">
        <Outlet />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
