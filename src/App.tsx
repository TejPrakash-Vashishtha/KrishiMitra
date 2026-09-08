import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation as useRouterLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LocationProvider } from "./contexts/LocationContext";
import { SocketProvider } from "./contexts/SocketContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";
import LanguageOnboardingModal from "./components/common/LanguageOnboardingModal";
import RoleSelectModal from "./components/common/RoleSelectModal";
import MerchantNavbar from "./components/merchant/MerchantNavbar";
import RequireRole from "./components/auth/RequireRole";

import LandingPage from "./pages/LandingPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import DealerDashboard from "./pages/DealerDashboard";
import AnalyzeCropPage from "./pages/AnalyzeCropPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import CropHistoryPage from "./pages/CropHistoryPage";
import SoilAnalysisPage from "./pages/SoilAnalysisPage";
import WeatherPage from "./pages/WeatherPage";
import ProductsPage from "./pages/ProductsPage";
import DealersPage from "./pages/DealersPage";
import ChatPage from "./pages/ChatPage";
import PostCropPage from "./pages/PostCropPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import LearnPage from "./pages/LearnPage";
import FarmerProfilePage from "./pages/FarmerProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MerchantLandingPage from "./pages/MerchantLandingPage";
import MerchantComingSoon from "./pages/MerchantComingSoon";

// 5 New Advanced Agricultural Intelligence Pages
import DigitalTwinPage from "./pages/DigitalTwinPage";
import ConsensusEnginePage from "./pages/ConsensusEnginePage";
import WhatIfSimulationPage from "./pages/WhatIfSimulationPage";
import AgronomyRAGPage from "./pages/AgronomyRAGPage";
import FieldMappingPage from "./pages/FieldMappingPage";

// Pillar 2: Post-Harvest & Market Features
import InventoryPage from "./pages/InventoryPage";
import MandiPricePage from "./pages/MandiPricePage";
import MarketplacePage from "./pages/MarketplacePage";
import SupplyChainPage from "./pages/SupplyChainPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const { user } = useAuth();
  const routerLocation = useRouterLocation();
  // Merchant area uses its own navbar; the farmer navbar/mobile nav is hidden there.
  const isMerchantArea = routerLocation.pathname.startsWith("/merchant");
  // Popups show on every visit while logged out (no persistence); once logged in, never again.
  const [langSelected, setLangSelected] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false);
  const showLangModal = !user && !langSelected;
  const showRoleModal = !user && langSelected && !roleSelected;
  const onboardingOpen = !user && (!langSelected || !roleSelected);

  return (
    <>
        <LanguageProvider>
          <LocationProvider>
            <SocketProvider>
              <div
                className={`flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-16 lg:pb-0 selection:bg-emerald-500 selection:text-white transition-[filter] duration-300 ${
                  onboardingOpen ? "blur-onboarding" : ""
                }`}
              >
                {!isMerchantArea && <Navbar />}
                {isMerchantArea && <MerchantNavbar />}
                <main className="flex-1">
                  <Routes>
                    {/* Existing Features */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard" element={<FarmerDashboard />} />
                    <Route path="/dealer-dashboard" element={<DealerDashboard />} />
                    <Route path="/analyze" element={<AnalyzeCropPage />} />
                    <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
                    <Route path="/history" element={<CropHistoryPage />} />
                    <Route path="/soil-analysis" element={<SoilAnalysisPage />} />
                    <Route path="/weather" element={<WeatherPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/dealers" element={<DealersPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/post-crop" element={<PostCropPage />} />
                    <Route path="/assistant" element={<AIAssistantPage />} />
                    <Route path="/learn" element={<LearnPage />} />
                    <Route path="/profile" element={<FarmerProfilePage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Merchant World (role-guarded) */}
                    <Route
                      path="/merchant"
                      element={
                        <RequireRole role="DEALER">
                          <MerchantLandingPage />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/merchant/search"
                      element={
                        <RequireRole role="DEALER">
                          <MerchantComingSoon
                            title="Crop Search & Filter"
                            description="Search any crop, set quantity, grade and price range — and instantly see nearby farmers with live stock and ratings."
                          />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/merchant/dashboard"
                      element={
                        <RequireRole role="DEALER">
                          <MerchantComingSoon
                            title="Merchant Dashboard"
                            description="Your complete purchase history: what you bought, from whom, how much you spent, and every deal's status."
                          />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/merchant/contacts"
                      element={
                        <RequireRole role="DEALER">
                          <MerchantComingSoon
                            title="B2B Contacts"
                            description="Direct call and WhatsApp contacts of every registered farmer near your location."
                          />
                        </RequireRole>
                      }
                    />

                    {/* 5 Advanced AI Engines */}
                    <Route path="/digital-twin" element={<DigitalTwinPage />} />
                    <Route path="/consensus-engine" element={<ConsensusEnginePage />} />
                    <Route path="/what-if-simulation" element={<WhatIfSimulationPage />} />
                    <Route path="/agronomy-rag" element={<AgronomyRAGPage />} />
                    <Route path="/field-mapping" element={<FieldMappingPage />} />

                    {/* Pillar 2: Post-Harvest & Market */}
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/mandi-prices" element={<MandiPricePage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/supply-chain" element={<SupplyChainPage />} />
                  </Routes>
                </main>                <Footer />
                {!isMerchantArea && <MobileNav />}
              </div>
              <LanguageOnboardingModal
                open={showLangModal}
                onSelect={() => setLangSelected(true)}
              />
              <RoleSelectModal
                open={showRoleModal}
                onSelect={() => setRoleSelected(true)}
              />
            </SocketProvider>
          </LocationProvider>
        </LanguageProvider>
    </>
  );
}
