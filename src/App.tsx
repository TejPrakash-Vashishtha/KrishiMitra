import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation as useRouterLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LocationProvider } from "./contexts/LocationContext";
import { SocketProvider } from "./contexts/SocketContext";
import { CartProvider } from "./contexts/CartContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";
import LanguageOnboardingModal from "./components/common/LanguageOnboardingModal";
import RoleSelectModal from "./components/common/RoleSelectModal";
import MerchantNavbar from "./components/merchant/MerchantNavbar";
import CustomerNavbar from "./components/customer/CustomerNavbar";
import RequireRole from "./components/auth/RequireRole";
import PageLoader from "./components/common/PageLoader";
import AppOpeningSplash from "./components/common/AppOpeningSplash";
import ClickFeedback from "./components/common/ClickFeedback";
import ScrollToTop from "./components/common/ScrollToTop";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationBannerToast from "./components/common/NotificationBannerToast";

// Landing page loads eagerly (first paint), everything else is code-split
// so each page downloads only its own JS — dramatically faster navigation.
import LandingPage from "./pages/LandingPage";

const FarmerDashboard = lazy(() => import("./pages/FarmerDashboard"));
const DealerDashboard = lazy(() => import("./pages/DealerDashboard"));
const AnalyzeCropPage = lazy(() => import("./pages/AnalyzeCropPage"));
const AnalysisDetailPage = lazy(() => import("./pages/AnalysisDetailPage"));
const CropHistoryPage = lazy(() => import("./pages/CropHistoryPage"));
const SoilAnalysisPage = lazy(() => import("./pages/SoilAnalysisPage"));
const WeatherPage = lazy(() => import("./pages/WeatherPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const DealersPage = lazy(() => import("./pages/DealersPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const PostCropPage = lazy(() => import("./pages/PostCropPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const FarmerProfilePage = lazy(() => import("./pages/FarmerProfilePage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const MerchantLandingPage = lazy(() => import("./pages/MerchantLandingPage"));
const MerchantSearchPage = lazy(() => import("./pages/MerchantSearchPage"));
const MerchantDashboardPage = lazy(() => import("./pages/MerchantDashboardPage"));
const MerchantComingSoon = lazy(() => import("./pages/MerchantComingSoon"));

// Customer World (Phases 2–4)
const CustomerLandingPage = lazy(() => import("./pages/CustomerLandingPage"));
const MarketplaceCustomerPage = lazy(() => import("./pages/MarketplaceCustomerPage"));
const FarmerConnectPage = lazy(() => import("./pages/FarmerConnectPage"));
const FarmerStorefrontPage = lazy(() => import("./pages/FarmerStorefrontPage"));
const CustomerChatPage = lazy(() => import("./pages/CustomerChatPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const CustomerProfilePage = lazy(() => import("./pages/CustomerProfilePage"));
const SellOnMarketplacePage = lazy(() => import("./pages/SellOnMarketplacePage"));
const FarmerOrdersPage = lazy(() => import("./pages/FarmerOrdersPage"));

// 5 New Advanced Agricultural Intelligence Pages
const DigitalTwinPage = lazy(() => import("./pages/DigitalTwinPage"));
const ConsensusEnginePage = lazy(() => import("./pages/ConsensusEnginePage"));
const WhatIfSimulationPage = lazy(() => import("./pages/WhatIfSimulationPage"));
const AgronomyRAGPage = lazy(() => import("./pages/AgronomyRAGPage"));
const FieldMappingPage = lazy(() => import("./pages/FieldMappingPage"));

// Pillar 2: Post-Harvest & Market Features
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const MandiPricePage = lazy(() => import("./pages/MandiPricePage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const SupplyChainPage = lazy(() => import("./pages/SupplyChainPage"));
const ProcessProducePage = lazy(() => import("./pages/ProcessProducePage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const SchemesPage = lazy(() => import("./pages/SchemesPage"));
const SchemeGapInsightsPage = lazy(() => import("./pages/SchemeGapInsightsPage"));

/**
 * Warms up the browser cache for the pages a user is most likely to visit
 * next, during idle time. Runs once per session after the app is interactive.
 */
function usePreloadCoreRoutes() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Farmer flow + auth pages are the highest-traffic destinations.
      void import("./pages/FarmerDashboard");
      void import("./pages/LoginPage");
      void import("./pages/WeatherPage");
      void import("./pages/MandiPricePage");
      void import("./pages/MerchantLandingPage");
      void import("./pages/CustomerLandingPage");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);
}

// Customer Dashboard — pooled supply chain
import CustomerDashboard from "./pages/CustomerDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const { user } = useAuth();
  const routerLocation = useRouterLocation();
  // Merchant and customer areas use their own navbars; the farmer
  // navbar/mobile nav is hidden there.
  const isMerchantArea = routerLocation.pathname.startsWith("/merchant");
  const isCustomerArea = routerLocation.pathname.startsWith("/shop");
  // Auth screens are full-bleed: no navbar/footer/bottom-bar, so the
  // liquid-glass surface fills the entire display on both web and mobile.
  const isAuthArea =
    routerLocation.pathname === "/login" || routerLocation.pathname === "/register";

  // App opening animation state
  const [splashActive, setSplashActive] = useState(() => {
    return sessionStorage.getItem("km_splash_viewed") !== "true";
  });

  useEffect(() => {
    const handleReplay = () => setSplashActive(true);
    window.addEventListener("replay-app-splash", handleReplay);
    return () => window.removeEventListener("replay-app-splash", handleReplay);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("km_splash_viewed", "true");
    setSplashActive(false);
  };

  // Popups show on every visit while logged out (no persistence); once logged in, never again.
  const [langSelected, setLangSelected] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false);
  const showLangModal = !user && !langSelected && !splashActive;
  const showRoleModal = !user && langSelected && !roleSelected && !splashActive;
  const onboardingOpen = !user && (!langSelected || !roleSelected) && !splashActive;

  usePreloadCoreRoutes();

  return (
    <>
      <ClickFeedback />
      <ScrollToTop />
      {splashActive && <AppOpeningSplash onComplete={handleSplashComplete} />}
      <LanguageProvider>
        <LocationProvider>
          <NotificationProvider>
            <SocketProvider>
              <NotificationBannerToast />
              <div
                className={`flex flex-col min-h-dvh-fill text-slate-900 selection:bg-emerald-500 selection:text-white transition-[filter] duration-300 ${
                  isAuthArea ? "bg-emerald-950" : "bg-slate-50 pb-mobile-nav"
                } ${onboardingOpen ? "blur-onboarding" : ""}`}
              >
                {!isAuthArea && !isMerchantArea && !isCustomerArea && <Navbar />}
                {isMerchantArea && <MerchantNavbar />}
                {isCustomerArea && <CustomerNavbar />}
                <main className="flex-1">
                  <Suspense fallback={<PageLoader />}>
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
                      <Route path="/subscription" element={<SubscriptionPage />} />

                      {/* Government Schemes — eligibility matcher + gap insights */}
                      <Route path="/schemes" element={<SchemesPage />} />
                      <Route path="/schemes/gap-insights" element={<SchemeGapInsightsPage />} />

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
                            <MerchantSearchPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/merchant/dashboard"
                        element={
                          <RequireRole role="DEALER">
                            <MerchantDashboardPage />
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

                      {/* Customer World (role-guarded) — Phase 2 */}
                      <Route
                        path="/shop"
                        element={
                          <RequireRole role="CUSTOMER">
                            <CustomerLandingPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/marketplace"
                        element={
                          <RequireRole role="CUSTOMER">
                            <MarketplaceCustomerPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/farmers"
                        element={
                          <RequireRole role="CUSTOMER">
                            <FarmerConnectPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/farmers/:id"
                        element={
                          <RequireRole role="CUSTOMER">
                            <FarmerStorefrontPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/chat/:farmerId"
                        element={
                          <RequireRole role="CUSTOMER">
                            <CustomerChatPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/orders"
                        element={
                          <RequireRole role="CUSTOMER">
                            <MyOrdersPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/shop/profile"
                        element={
                          <RequireRole role="CUSTOMER">
                            <CustomerProfilePage />
                          </RequireRole>
                        }
                      />

                      {/* 5 Advanced AI Engines */}
                      <Route path="/digital-twin" element={<DigitalTwinPage />} />
                      <Route path="/consensus-engine" element={<ConsensusEnginePage />} />
                      <Route path="/what-if-simulation" element={<WhatIfSimulationPage />} />
                      <Route path="/agronomy-rag" element={<AgronomyRAGPage />} />
                      <Route path="/field-mapping" element={<FieldMappingPage />} />

                      {/* Phase 7: farmer lists produce for the marketplace */}
                      <Route
                        path="/sell"
                        element={<SellOnMarketplacePage />}
                      />
                      {/* Farmer's incoming customer orders (Phase 6 loop) */}
                      <Route
                        path="/farmer-orders"
                        element={<FarmerOrdersPage />}
                      />

                      {/* Pillar 2: Post-Harvest & Market */}
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/mandi-prices" element={<MandiPricePage />} />
                      <Route path="/marketplace" element={<MarketplacePage />} />
                      <Route path="/supply-chain" element={<SupplyChainPage />} />
                      {/* Feature A: process produce into value-added products */}
                      <Route path="/process" element={<ProcessProducePage />} />

                      {/* Customer Dashboard — pooled supply chain (open showcase) */}
                      <Route path="/customer" element={<CustomerDashboard />} />
                    </Routes>
                  </Suspense>
                </main>
                {!isAuthArea && <Footer />}
                {!isAuthArea && !isMerchantArea && !isCustomerArea && <MobileNav />}
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
          </NotificationProvider>
        </LocationProvider>
      </LanguageProvider>
    </>
  );
}
