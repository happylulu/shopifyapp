import { QueryProvider } from "../../lib/providers/QueryProvider";

export function TanstackProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>{children}</QueryProvider>
  );
}
