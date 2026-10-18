import { QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { PokemonListPage } from "@/features/list/PokemonListPage";
import { PokemonDetailsPage } from "@/features/details/PokemonDetailsPage";
import { EncountersPage } from "@/features/details/EncountersPage";
import { NotFound } from "@/features/not-found/NotFound";
import { TypeChartPage } from "@/features/types/TypeChartPage";
import { VersusPage } from "@/features/versus/VersusPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { EraProvider } from "@/era/EraProvider";
import { queryClient } from "./queryClient";
import "@/global.css";

/** Versus first shipped at `/compare`; links to it still land, picks and all. */
const FormerVersusAddress = () => {
  const { search } = useLocation();
  return <Navigate to={`/versus${search}`} replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EraProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#eaebf2] font-press-start flex flex-col">
            <Navbar />
            <main className="flex-grow pt-12">
              <Routes>
                <Route path="/" element={<PokemonListPage />} />
                <Route path="/pokemon/:name" element={<PokemonDetailsPage />} />
                {/* PokéAPI's own shape for the same question, and a page of its
                    own because the answer runs to dozens of places. */}
                <Route
                  path="/pokemon/:name/encounters"
                  element={<EncountersPage />}
                />
                <Route path="/types" element={<TypeChartPage />} />
                <Route path="/versus" element={<VersusPage />} />
                <Route path="/compare" element={<FormerVersusAddress />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <ScrollToTopButton />
            <Footer />
          </div>
        </BrowserRouter>
      </EraProvider>
    </QueryClientProvider>
  );
}

export default App;
