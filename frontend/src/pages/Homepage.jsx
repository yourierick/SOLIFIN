/**
 * Homepage.jsx - Page d'accueil
 *
 * Page principale de l'application présentant l'offre et les fonctionnalités.
 * Point d'entrée pour les nouveaux utilisateurs et vitrine du service.
 *
 * Sections :
 * - Hero : Message principal et CTA
 * - Features : Fonctionnalités clés
 * - Packages : Offres et tarifs
 * - Testimonials : Avis clients
 * - FAQ : Questions fréquentes
 * - Contact : Formulaire de contact
 *
 * Composants :
 * - Navbar : Navigation principale
 * - Hero : Section d'en-tête
 * - Features : Grille de fonctionnalités
 * - Packages : Liste des offres
 * - Testimonials : Carrousel d'avis
 * - FAQ : Accordéon de questions
 * - Footer : Pied de page
 *
 * Caractéristiques :
 * - Design responsive
 * - Animations au scroll
 * - Navigation fluide
 * - Optimisation SEO
 * - Performance optimisée
 *
 * Intégrations :
 * - Formulaire de contact
 * - Système de newsletter
 * - Liens réseaux sociaux
 * - Chat support (si actif)
 */

import Hero from "../components/Hero";
import Features from "../components/Features";
import Packages from "../components/Packages";
import Referral from "../components/Referral";
import Founder from "../components/Founder";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Ads from "../components/Ads";
import ThemeToggle from "../components/ThemeToggle";
import SectionDivider from "../components/SectionDivider";
import AboutSolifin from "../components/AboutSolifin";
import OurServices from "../components/OurServices";
import TheoryOfChange from "../components/TheoryOfChange";
import LegalDocumentModal from "../components/LegalDocumentModal";
import MobileLoginButton from "../components/MobileLoginButton";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function Homepage() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [settings, setSettings] = useState({
    social: {},
    founder: {},
    legal: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour le modal de document légal
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [currentLegalDocument, setCurrentLegalDocument] = useState(null);

  // Fonction pour ouvrir le modal de document légal
  const openLegalDocument = (documentKey) => {
    setCurrentLegalDocument(documentKey);
    setLegalModalOpen(true);
  };

  // Récupérer les paramètres publics
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/settings/load`);
        if (response.data.success && response.data.data) {
          setSettings(response.data.data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des paramètres:", err);
        setError("Impossible de charger les paramètres");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Gestion du défilement vers la section des packages
  useEffect(() => {
    if (location.state && location.state.scrollToPackages) {
      const section = document.getElementById("packages");
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" });
        }, 200); // attend que la page soit montée
      }
    }
  }, [location]);

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden ${
        isDarkMode
          ? "bg-gradient-to-b from-gray-900 to-gray-800"
          : "bg-gradient-to-b from-primary-50 to-white"
      }`}
    >
      <Navbar />
      <main className="relative w-full overflow-hidden">
        <section id="hero">
          <Hero />
        </section>
        <SectionDivider />
        <section id="about">
          <AboutSolifin />
        </section>
        <SectionDivider />
        <section id="theory-of-change">
          <TheoryOfChange />
        </section>
        <SectionDivider />
        <section id="features">
          <Features />
        </section>
        <SectionDivider />
        <section id="services">
          <OurServices />
        </section>
        <SectionDivider />
        <section id="ads">
          <Ads />
        </section>
        <SectionDivider />
        <section id="packages">
          <Packages />
        </section>
        <SectionDivider />
        <section id="referral">
          <Referral />
        </section>
        <SectionDivider />
        <section id="stats">
          <Stats />
        </section>
        <SectionDivider />
        <section id="testimonials">
          <Testimonials />
        </section>
        <SectionDivider />
        {/* <section id="founder">
          <Founder
            founderPhoto={settings.founder?.founder_photo}
            isLoading={loading}
            error={error}
          />
        </section> */}
        <SectionDivider />
        <section id="faq">
          <FAQ
            whatsappUrl={
              settings.social?.whatsapp_url || "https://wa.me/33600000000"
            }
          />
        </section>
        <SectionDivider />
      </main>
      <SectionDivider />
      <Footer
        socialLinks={settings.social}
        legalDocs={settings.legal}
        isLoading={loading}
        error={error}
        openLegalDocument={openLegalDocument}
      />
      <ThemeToggle />

      {/* Bouton flottant de connexion pour mobile */}
      <MobileLoginButton />

      {/* Modal pour les documents légaux */}
      <LegalDocumentModal
        documentKey={currentLegalDocument}
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
}
