/**
 * App.jsx - Composant racine de l'application
 *
 * Ce composant est le point d'entrée principal de l'application. Il est responsable de :
 * - La configuration des providers globaux (Auth, Theme, Toast)
 * - La mise en place du routage de l'application
 * - La gestion des layouts principaux
 * - L'initialisation des configurations globales
 *
 * Structure :
 * - Providers : Contextes globaux pour l'authentification, le thème et les notifications
 * - Router : Configuration des routes publiques et protégées
 * - Layouts : Structures de mise en page pour différentes sections (admin, user, public)
 *
 * Fonctionnalités :
 * - Gestion de l'état de connexion
 * - Redirection intelligente basée sur les rôles
 * - Persistance du thème
 * - Système de notifications toast
 */

import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { useAuth } from "./contexts/AuthContext";
import { PublicationPackProvider } from "./contexts/PublicationPackContext";
import { ChatProvider } from "./contexts/ChatContext";
import { BroadcastProvider } from "./contexts/BroadcastContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import ToastContainer from "./components/Toast";
import ChatInterface from "./components/chat/ChatInterface";

// Layouts - Gardés en import direct car ils sont essentiels pour la structure de l'application
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import UserDashboardLayout from "./layouts/UserDashboardLayout";

// Composant de chargement pour Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// Pages publiques - Chargées de manière différée
const Homepage = lazy(() => import("./pages/Homepage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const VerificationSuccess = lazy(() => import("./pages/VerificationSuccess"));
const VerificationError = lazy(() => import("./pages/VerificationError"));
const PromptLoginOrSubscribePage = lazy(() =>
  import("./pages/PromptLoginOrSubscribePage")
);

// Pages administrateur - Chargées de manière différée
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const UserDetails = lazy(() => import("./pages/admin/UserDetails"));
const Wallets = lazy(() => import("./pages/admin/Wallets"));
const Packs = lazy(() => import("./pages/admin/Packs"));
const AddPack = lazy(() => import("./pages/admin/AddPack"));
const EditPack = lazy(() => import("./pages/admin/EditPack"));
const MesPacks = lazy(() => import("./pages/admin/MyPacks"));
const AdminFinances = lazy(() => import("./pages/admin/Finances"));
const ContentManagement = lazy(() =>
  import("./pages/admin/components/ContentManagement")
);
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const BroadcastMessagesPage = lazy(() =>
  import("./pages/admin/BroadcastMessagesPage")
);
const FaqManagement = lazy(() => import("./pages/admin/FaqManagement"));
const CadeauxManagement = lazy(() =>
  import("./pages/admin/components/CadeauxManagement")
);
const AdvertisementValidation = lazy(() =>
  import("./pages/admin/AdvertisementValidation")
);
const Commissions = lazy(() => import("./pages/admin/Commissions"));
const TestimonialManagement = lazy(() =>
  import("./pages/admin/TestimonialManagement")
);
const FormationManagement = lazy(() =>
  import("./pages/admin/components/FormationManagement")
);
const TicketVerification = lazy(() =>
  import("./pages/admin/components/TicketVerification")
);

// Pages utilisateur - Chargées de manière différée
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Wallet = lazy(() => import("./pages/user/Wallet"));
const UserFinances = lazy(() => import("./pages/user/Finances"));
const BuyPack = lazy(() => import("./pages/user/Packs"));
const MyPacks = lazy(() => import("./pages/user/MyPacks"));
const Stats = lazy(() => import("./pages/user/Stats"));
const MyPage = lazy(() => import("./pages/user/MyPage"));
const Page = lazy(() => import("./pages/user/Page"));
const UserFaq = lazy(() => import("./pages/user/Faq"));
const FormationEditor = lazy(() =>
  import("./pages/user/components/FormationEditor")
);
const Formations = lazy(() => import("./pages/user/components/Formations"));
const Social = lazy(() => import("./pages/user/Social"));
const ChatPollingTest = lazy(() => import("./pages/ChatPollingTest"));

// Composants
const WithdrawalRequests = lazy(() =>
  import("./components/WithdrawalRequests")
);
import PrefetchManager from "./components/PrefetchManager";
import ServiceWorkerUpdater from "./components/ServiceWorkerUpdater";

function App() {
  return (
    <CurrencyProvider>
      <PublicationPackProvider>
        <ChatProvider>
          <BroadcastProvider>
            <div>
              <ToastContainer />
              <ChatInterface />
              <PrefetchManager />
              <ServiceWorkerUpdater />
              <Routes>
                {/* Routes publiques */}
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Homepage />
                    </Suspense>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Login />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Register />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                {/* Page d'invitation à la connexion ou souscription */}
                <Route
                  path="/interet"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <PromptLoginOrSubscribePage />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <ForgotPassword />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/reset-password/:token"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <ResetPassword />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/email/verify/:id/:hash"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <EmailVerification />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verification-success"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <VerificationSuccess />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verification-error"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <VerificationError />
                      </Suspense>
                    </PublicRoute>
                  }
                />

                {/* Routes protégées */}
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminDashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminDashboard />
                      </Suspense>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UsersManagement />
                      </Suspense>
                    }
                  />
                  <Route
                    path="users/:id"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserDetails />
                      </Suspense>
                    }
                  />
                  <Route
                    path="wallets"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Wallets />
                      </Suspense>
                    }
                  />
                  <Route
                    path="packs"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Packs />
                      </Suspense>
                    }
                  />
                  <Route
                    path="packs/add"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AddPack />
                      </Suspense>
                    }
                  />
                  <Route
                    path="packs/edit/:id"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditPack />
                      </Suspense>
                    }
                  />
                  {/* <Route path="mespacks" element={<Suspense fallback={<LoadingSpinner />}><MesPacks /></Suspense>} /> */}
                  {/* <Route path="commissions" element={<Suspense fallback={<LoadingSpinner />}><Commissions /></Suspense>} /> */}
                  <Route
                    path="finances"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminFinances />
                      </Suspense>
                    }
                  />
                  {/* <Route
              path="withdrawal-requests"
              element={<Suspense fallback={<LoadingSpinner />}><WithdrawalRequests /></Suspense>}
            /> */}
                  <Route
                    path="content-management"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ContentManagement />
                      </Suspense>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminProfile />
                      </Suspense>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Settings />
                      </Suspense>
                    }
                  />
                  <Route
                    path="broadcast-messages"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <BroadcastMessagesPage />
                      </Suspense>
                    }
                  />
                  {/* <Route path="administrators" element={<Suspense fallback={<LoadingSpinner />}><AdminManagement /></Suspense>} /> */}
                  {/* <Route path="testimonials" element={<Suspense fallback={<LoadingSpinner />}><TestimonialManagement /></Suspense>} /> */}
                  <Route
                    path="faqs"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <FaqManagement />
                      </Suspense>
                    }
                  />
                  {/* <Route path="formations" element={<Suspense fallback={<LoadingSpinner />}><FormationManagement /></Suspense>} /> */}
                  <Route
                    path="cadeaux"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <CadeauxManagement />
                      </Suspense>
                    }
                  />
                  {/* <Route
              path="tickets-verification"
              element={<Suspense fallback={<LoadingSpinner />}><TicketVerification /></Suspense>}
            /> */}
                </Route>

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <UserDashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserDashboard />
                      </Suspense>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Profile />
                      </Suspense>
                    }
                  />
                  {/* <Route path="wallet" element={<Suspense fallback={<LoadingSpinner />}><Wallet /></Suspense>} /> */}
                  <Route
                    path="finances"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserFinances />
                      </Suspense>
                    }
                  />
                  <Route
                    path="packs"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <BuyPack />
                      </Suspense>
                    }
                  />
                  <Route
                    path="packs/:id"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <MyPacks />
                      </Suspense>
                    }
                  />
                  <Route
                    path="stats"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Stats />
                      </Suspense>
                    }
                  />
                  {/* <Route path="news-feed" element={<Suspense fallback={<LoadingSpinner />}><NewsFeed /></Suspense>} /> */}
                  <Route
                    path="my-page"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <MyPage />
                      </Suspense>
                    }
                  />
                  {/* <Route path="social" element={<Suspense fallback={<LoadingSpinner />}><Social /></Suspense>} /> */}
                  {/* <Route path="jetons-esengo" element={<Suspense fallback={<LoadingSpinner />}><JetonsEsengo /></Suspense>} /> */}
                  <Route
                    path="faq"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserFaq />
                      </Suspense>
                    }
                  />
                  {/* <Route path="formations" element={<Suspense fallback={<LoadingSpinner />}><Formations /></Suspense>} /> */}
                  <Route
                    path="formations/edit/:id"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <FormationEditor />
                      </Suspense>
                    }
                  />
                  <Route
                    path="formations/create"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <FormationEditor />
                      </Suspense>
                    }
                  />
                  <Route
                    path="pages/:id"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Page />
                      </Suspense>
                    }
                  />
                  <Route
                    path="chat-polling-test"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ChatPollingTest />
                      </Suspense>
                    }
                  />
                </Route>

                {/* Redirection pour les routes inconnues */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BroadcastProvider>
        </ChatProvider>
      </PublicationPackProvider>
    </CurrencyProvider>
  );
}

// Composant pour les routes publiques
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const currentPath = window.location.pathname;
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verification-success",
    "/verification-error",
  ];

  // Attendre que la vérification de l'authentification soit terminée
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Permettre à tous les utilisateurs (authentifiés ou non) d'accéder à la page d'accueil
  if (currentPath === "/") {
    return children;
  }

  if (authRoutes.includes(currentPath)) {
    if (user) {
      const isAdmin =
        user.is_admin === 1 || user.is_admin === true || user.role === "admin";
      return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
    }
    return children;
  }
  return children;
};

// Composant pour les routes protégées
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const currentPath = window.location.pathname;

  // Afficher le loader pendant le chargement initial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Rediriger vers login uniquement si on n'est pas en train de charger et qu'il n'y a pas d'utilisateur
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin =
    user.is_admin === 1 || user.is_admin === true || user.role === "admin";

  // Vérifier les permissions d'accès selon le chemin
  if (currentPath.startsWith("/admin") && !isAdmin) {
    // Si l'utilisateur n'est pas admin et essaie d'accéder à une route admin
    return <Navigate to="/dashboard" replace />;
  } else if (currentPath.startsWith("/dashboard") && isAdmin) {
    // Si l'utilisateur est admin et essaie d'accéder à une route utilisateur
    // Optionnel: vous pouvez permettre aux admins d'accéder aux routes utilisateur
    // en commentant ou supprimant cette condition
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default App;
