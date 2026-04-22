import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ReactQueryClientProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export function ReactQueryClient({ children }: ReactQueryClientProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
