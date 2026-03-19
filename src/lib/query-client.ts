import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min
        gcTime: 5 * 60 * 1000, // 5 min
        retry: (failureCount, error) => {
          // Don't retry on 401, 403, 404
          if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (
              msg.includes("401") ||
              msg.includes("403") ||
              msg.includes("404") ||
              msg.includes("no encontrad")
            ) {
              return false;
            }
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
