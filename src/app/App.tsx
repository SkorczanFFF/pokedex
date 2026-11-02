import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { PokemonListPage } from "@/features/list/PokemonListPage";
import { PokemonDetailsPage } from "@/features/details/PokemonDetailsPage";
import { EncountersPage } from "@/features/encounters/EncountersPage";
import { NotFound } from "@/components/NotFound";
import { TypeChartPage } from "@/features/types/TypeChartPage";
import { VersusPage } from "@/features/versus/VersusPage";
import { AboutPage } from "@/features/about/AboutPage";
import { StadiumGamePage, StadiumPage } from "@/features/stadium/StadiumPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ErrorView from "@/components/ErrorView";
import { EraProvider } from "@/app/era/EraProvider";
import { queryClient } from "./queryClient";
import { paths } from "./routes";

/** Versus first shipped at `/compare`; links to it still land, picks and all. */
const FormerVersusAddress = () => {
  const { search } = useLocation();
  return <Navigate to={`${paths.versus}${search}`} replace />;
};

/** A page that throws leaves the navbar and footer standing; any navigation tries again. */
const PageBoundary = ({ children }: { children: ReactNode }) => {
  const { key } = useLocation();
  const { t } = useTranslation();
  return (
    <ErrorBoundary resetKey={key} fallback={<ErrorView message={t("error.page")} />}>
      {children}
    </ErrorBoundary>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EraProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-dex-bg font-press-start flex flex-col">
            <Navbar />
            <main className="flex-grow pt-nav">
              <PageBoundary>
                <Routes>
                  <Route path={paths.list} element={<PokemonListPage />} />
                  <Route path={paths.pokemon} element={<PokemonDetailsPage />} />
                  <Route path={paths.encounters} element={<EncountersPage />} />
                  <Route path={paths.types} element={<TypeChartPage />} />
                  <Route path={paths.versus} element={<VersusPage />} />
                  <Route path={paths.formerVersus} element={<FormerVersusAddress />} />
                  <Route path={paths.about} element={<AboutPage />} />
                  <Route path={paths.stadium} element={<StadiumPage />} />
                  <Route path={paths.stadiumGame} element={<StadiumGamePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageBoundary>
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
