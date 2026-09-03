import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PokemonListPage } from "@/features/list/PokemonListPage";
import { PokemonDetailsPage } from "@/features/details/PokemonDetailsPage";
import { NotFound } from "@/features/not-found/NotFound";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { queryClient } from "./queryClient";
import "@/global.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#eaebf2] font-press-start flex flex-col">
          <Navbar />
          <main className="flex-grow pt-12">
            <Routes>
              <Route path="/" element={<PokemonListPage />} />
              <Route path="/pokemon/:name" element={<PokemonDetailsPage />} />
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
