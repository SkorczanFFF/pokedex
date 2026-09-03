import { QueryClient } from "@tanstack/react-query";
import { NotFoundError } from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      // A 404 is an answer, not a failure. Retrying it only delays the page
      // that is already the right thing to show.
      retry: (failureCount, error) =>
        !(error instanceof NotFoundError) && failureCount < 2,
    },
  },
});
