import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PokemonList } from "./pages/PokemonList";
import { PokemonDetails } from "./pages/PokemonDetails";
import { NotFound } from "./pages/NotFound";
import { NotFoundError } from "@/api/client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import ScrollToTopButton from "./components/ScrollToTopButton";

const queryClient = new QueryClient({
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#eaebf2] font-press-start flex flex-col">
          <Navbar />
          <main className="flex-grow pt-12">
            <Routes>
              <Route path="/" element={<PokemonList />} />
              <Route path="/pokemon/:name" element={<PokemonDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <ScrollToTopButton />
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
