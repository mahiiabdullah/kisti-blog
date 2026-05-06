import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export const AppThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    {children}
  </ThemeProvider>
);
