import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PokemonList } from "./pages/PokemonList";
import { PokemonDetails } from "./pages/PokemonDetails";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import ScrollToTopButton from "./components/ScrollToTopButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
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
              <Route path="/" element={<Navigate to="/1" replace />} />
              <Route path="/:page" element={<PokemonList />} />
              <Route path="/pokemon/:name" element={<PokemonDetails />} />
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
