import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../contexts/AuthContext";
import { usePublicationPack } from "../../../contexts/PublicationPackContext";
import PublicationPackAlert from "../../../components/PublicationPackAlert";
import Notification from "../../../components/Notification";
import CountryCodeSelector from "../../../components/CountryCodeSelector";
import CountrySelector from "../../../components/CountrySelector";

/**
 * Composant formulaire pour créer différents types de publications
 * (publicités, offres d'emploi, opportunités d'affaires)
 */
export default function PublicationForm({
  type,
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false,
}) {
  // Extraire l'indicatif téléphonique et le numéro si disponible en mode édition
  let initialPhoneCode = "+243"; // Valeur par défaut: Côte d'Ivoire
  let initialPhoneNumber = "";

  if (isEditMode && initialData && initialData.contacts) {
    // Essayer d'extraire l'indicatif du numéro de téléphone
    const phoneMatch = initialData.contacts.match(/^(\+\d+)\s*(.*)$/);
    if (phoneMatch) {
      initialPhoneCode = phoneMatch[1];
      initialPhoneNumber = phoneMatch[2];
    } else {
      initialPhoneNumber = initialData.contacts;
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues:
      isEditMode && initialData
        ? {
            type: initialData.type,
            categorie: initialData.categorie,
            sous_categorie: initialData.sous_categorie,
            autre_sous_categorie: initialData.autre_sous_categorie,
            titre: initialData.titre,
            description: initialData.description,
            // Ajouter les champs pays, ville et secteur
            pays: initialData.pays || "",
            ville: initialData.ville || "",
            secteur: initialData.secteur || "",
            // D'autres champs génériques qui peuvent être présents
            phoneNumber: initialPhoneNumber, // Nouveau champ pour le numéro sans l'indicatif
            email: initialData.email,
            adresse: initialData.adresse,
            lien: initialData.lien,
            devise: initialData.devise,
            besoin_livreurs: initialData.besoin_livreurs,
            point_vente: initialData.point_vente,
            quantite_disponible: initialData.quantite_disponible,
            prix_unitaire_vente: initialData.prix_unitaire_vente,
            commission_livraison: initialData.commission_livraison,
            prix_unitaire_livraison: initialData.prix_unitaire_livraison,
          }
        : {},
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedOpportunityPdf, setSelectedOpportunityPdf] = useState(null);

  // États pour les fichiers initiaux en mode édition
  const [initialPdfUrl, setInitialPdfUrl] = useState(null);
  const [initialPdfName, setInitialPdfName] = useState("");
  const [showInitialOfferPdf, setShowInitialOfferPdf] = useState(false);
  const [initialOpportunityUrl, setInitialOpportunityUrl] = useState(null);
  const [initialOpportunityName, setInitialOpportunityName] = useState("");
  const [showInitialOpportunityPdf, setShowInitialOpportunityPdf] =
    useState(false);

  const [initialImageUrl, setInitialImageUrl] = useState(null);
  const [initialImageName, setInitialImageName] = useState("");
  const [showInitialImage, setShowInitialImage] = useState(false);

  const [initialVideoUrl, setInitialVideoUrl] = useState(null);
  const [initialVideoName, setInitialVideoName] = useState("");
  const [showInitialVideo, setShowInitialVideo] = useState(false);

  // États pour les erreurs
  const [imageError, setImageError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [conditionsLivraison, setConditionsLivraison] = useState(
    isEditMode && initialData && initialData.conditions_livraison
      ? typeof initialData.conditions_livraison === "string"
        ? JSON.parse(initialData.conditions_livraison)
        : initialData.conditions_livraison
      : []
  );
  const [phoneCode, setPhoneCode] = useState(initialPhoneCode);
  // États pour les pays sélectionnés
  const [selectedCountries, setSelectedCountries] = useState({
    pays: isEditMode && initialData && initialData.pays ? initialData.pays : "",
    pays_jobOffer:
      isEditMode && initialData && initialData.pays ? initialData.pays : "",
    pays_business:
      isEditMode && initialData && initialData.pays ? initialData.pays : "",
  });

  // Fonction pour rendre un champ de sélection de pays avec drapeaux
  const renderCountryField = (name, label, required, placeholder) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <CountrySelector
          value={selectedCountries[name]}
          onChange={(value) => {
            // Mettre à jour l'état local
            setSelectedCountries((prev) => ({
              ...prev,
              [name]: value,
            }));
            // Mettre à jour la valeur dans le formulaire
            setValue(name, value);
          }}
          placeholder={placeholder || "Sélectionner un pays"}
        />
        <input
          type="hidden"
          id={name}
          {...register(name, { required: required && `${label} est requis` })}
        />
      </div>
    );
  };

  // Mettre à jour le champ caché conditions_livraison lorsque l'état change
  useEffect(() => {
    if (conditionsLivraison && conditionsLivraison.length > 0) {
      // Filtrer les conditions vides
      const filteredConditions = conditionsLivraison.filter(
        (condition) => condition.trim() !== ""
      );
      setValue("conditions_livraison", JSON.stringify(filteredConditions));
    } else {
      setValue("conditions_livraison", JSON.stringify([]));
    }
  }, [conditionsLivraison, setValue]);

  const { user } = useAuth();
  const { isActive: isPackActive, packInfo } = usePublicationPack();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const watchCategorie = watch("categorie");
  const watchBesoinLivreurs = watch("besoin_livreurs");
  const watchSousCategorie = watch("sous_categorie");

  // Charger les fichiers initiaux en mode édition
  useEffect(() => {
    if (isEditMode && initialData) {
      // Traitement du fichier PDF (offres d'emploi)
      if (initialData.offer_file_url) {
        setInitialPdfUrl(initialData.offer_file_url);

        // Extraire le nom du fichier de l'URL
        // Enlever les paramètres d'URL s'il y en a (tout ce qui suit ?) et décoder les caractères spéciaux
        const fileName = initialData.offer_file_url
          .split("/")
          .pop()
          .split("?")[0];
        const decodedFileName = decodeURIComponent(fileName);

        // Extraire le nom original du fichier (enlever le timestamp s'il existe)
        const originalFileName = decodedFileName.replace(/^\d+_/, "");

        setInitialPdfName(originalFileName);
        setShowInitialOfferPdf(true);
      } else if (initialData.offer_file) {
        // Si nous avons juste le chemin du fichier sans l'URL complète
        const fileName = initialData.offer_file
          .split("/")
          .pop()
          .replace(/^\d+_/, "");
        setInitialPdfName(fileName);
        setShowInitialOfferPdf(true);
      }

      if (initialData.opportunity_file_url) {
        setInitialOpportunityUrl(initialData.opportunity_file_url);

        // Extraire le nom du fichier de l'URL
        // Enlever les paramètres d'URL s'il y en a (tout ce qui suit ?) et décoder les caractères spéciaux
        const fileName = initialData.opportunity_file_url
          .split("/")
          .pop()
          .split("?")[0];
        const decodedFileName = decodeURIComponent(fileName);

        // Extraire le nom original du fichier (enlever le timestamp s'il existe)
        const originalFileName = decodedFileName.replace(/^\d+_/, "");

        setInitialOpportunityName(originalFileName);
        setShowInitialOpportunityPdf(true);
      } else if (initialData.opportunity_file) {
        // Si nous avons juste le chemin du fichier sans l'URL complète
        const fileName = initialData.opportunity_file
          .split("/")
          .pop()
          .replace(/^\d+_/, "");
        setInitialOpportunityName(fileName);
        setShowInitialOpportunityPdf(true);
      }

      // Traitement de l'image (publicités et opportunités d'affaires)
      if (initialData.image_url) {
        setInitialImageUrl(initialData.image_url);

        // Extraire le nom du fichier de l'URL
        const fileName = initialData.image_url.split("/").pop().split("?")[0];
        const decodedFileName = decodeURIComponent(fileName);
        const originalFileName = decodedFileName.replace(/^\d+_/, "");

        setInitialImageName(originalFileName);
        setShowInitialImage(true);
      } else if (initialData.image) {
        const fileName = initialData.image
          .split("/")
          .pop()
          .replace(/^\d+_/, "");
        setInitialImageName(fileName);
        setShowInitialImage(true);
      }

      // Traitement de la vidéo (publicités)
      if (initialData.video_url) {
        setInitialVideoUrl(initialData.video_url);

        // Extraire le nom du fichier de l'URL
        const fileName = initialData.video_url.split("/").pop().split("?")[0];
        const decodedFileName = decodeURIComponent(fileName);
        const originalFileName = decodedFileName.replace(/^\d+_/, "");

        setInitialVideoName(originalFileName);
        setShowInitialVideo(true);
      } else if (initialData.video) {
        const fileName = initialData.video
          .split("/")
          .pop()
          .replace(/^\d+_/, "");
        setInitialVideoName(fileName);
        setShowInitialVideo(true);
      }
    }
  }, [isEditMode, initialData]);

  const formFields = {
    advertisement: [
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "publicité", label: "Publicité" },
          { value: "annonce", label: "Annonce" },
        ],
      },
      {
        name: "pays",
        label: "Pays",
        type: "country",
        required: true,
        placeholder: "Sélectionner un pays",
      },
      {
        name: "ville",
        label: "Ville",
        type: "text",
        required: true,
        placeholder: "Ex: Kinshasa",
      },
      {
        name: "categorie",
        label: "Catégorie",
        type: "select",
        required: true,
        options: [
          { value: "produit", label: "Produit" },
          { value: "service", label: "Service" },
        ],
      },
      {
        name: "sous_categorie",
        label: "Sous-catégorie",
        type: "select",
        required: true,
        options: [
          { value: "location de véhicule", label: "Location de véhicule" },
          { value: "location de maison", label: "Location de maison" },
          { value: "réservation", label: "Réservation" },
          { value: "livraison", label: "Livraison" },
          { value: "vente", label: "Vente" },
          { value: "sous-traitance", label: "Sous-traitance" },
          { value: "autre à préciser", label: "Autre à préciser" },
        ],
      },
      {
        name: "autre_sous_categorie",
        label: "Précisez la sous-catégorie",
        type: "text",
        placeholder: "Précisez votre sous-catégorie",
        show: () => watchSousCategorie === "autre à préciser",
      },
      {
        name: "titre",
        label: "Titre",
        type: "text",
        required: true,
        placeholder: "Titre de votre publicité",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Description détaillée de votre publicité",
      },
      {
        name: "image",
        label: "Image (max: 2Mo)",
        type: "file",
        accept: "image/*",
      },
      {
        name: "video",
        label: "Vidéo (max: 10Mo)",
        type: "file",
        accept: "video/*",
      },
      {
        name: "phoneNumber",
        label: "Numéro de téléphone",
        type: "phone",
        required: true,
        placeholder: "Numéro sans indicatif et sans 0 initial (ex: 123456789)",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Email de contact",
      },
      {
        name: "adresse",
        label: "Adresse",
        type: "text",
        placeholder: "Adresse physique",
      },
      {
        name: "besoin_livreurs",
        label: "Besoin de livreurs",
        type: "select",
        options: [
          { value: "OUI", label: "Oui" },
          { value: "NON", label: "Non" },
        ],
      },
      {
        name: "conditions_livraison",
        label: "Conditions de livraison",
        type: "custom",
        show: (values) => values.besoin_livreurs === "OUI",
      },
      {
        name: "point_vente",
        label: "Point de vente",
        type: "text",
        placeholder: "Emplacement du point de vente",
      },
      {
        name: "quantite_disponible",
        label: "Quantité disponible",
        type: "number",
        show: (values) => values.categorie === "produit",
      },
      {
        name: "prix_unitaire_vente",
        label: "Prix unitaire de vente sur place",
        type: "number",
        required: true,
      },
      {
        name: "devise",
        label: "Devise",
        type: "select",
        required: true,
        options: [
          { value: "XOF", label: "XOF (FCFA)" },
          { value: "EUR", label: "EUR (€)" },
          { value: "USD", label: "USD ($)" },
          { value: "YEN", label: "YEN (¥)" },
          { value: "YUAN", label: "YUAN (¥)" },
          { value: "CDF", label: "CDF (FC)" },
          { value: "SAR", label: "SAR (﷼)" },
        ],
      },
      {
        name: "commission_livraison",
        label: "Commission de livraison",
        type: "select",
        options: [
          { value: "OUI", label: "Oui" },
          { value: "NON", label: "Non" },
        ],
        show: (values) => values.besoin_livreurs === "OUI",
      },
      {
        name: "prix_unitaire_livraison",
        label: "Prix unitaire de vente à la livraison",
        type: "number",
        show: (values) => values.besoin_livreurs === "OUI",
      },
      {
        name: "lien",
        label: "Lien",
        type: "url",
        placeholder: "Lien externe (site web, boutique en ligne, etc.)",
      },
    ],

    jobOffer: [
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "offre_emploi", label: "Offre d'emploi" },
          {
            value: "appel_manifestation_intéret",
            label: "Appel à manifestation d'intérêt",
          },
        ],
      },
      {
        name: "reference",
        label: "Référence",
        type: "text",
        required: true,
        placeholder: "Ex: REF-123456",
      },
      {
        name: "titre",
        label: "Titre",
        type: "text",
        required: true,
      },
      {
        name: "entreprise",
        label: "Entreprise",
        type: "text",
        required: true,
        placeholder: "Nom de l'entreprise",
      },
      {
        name: "pays",
        label: "Pays",
        type: "country",
        required: true,
        placeholder: "Sélectionner un pays",
      },
      {
        name: "ville",
        label: "Ville",
        type: "text",
        required: true,
        placeholder: "Ex: Kinshasa",
      },
      {
        name: "secteur",
        label: "Secteur d'activité",
        type: "text",
        required: true,
        placeholder: "Ex: Informatique, Finance, Santé...",
      },
      {
        name: "type_contrat",
        label: "Type de contrat",
        type: "select",
        required: true,
        options: [
          { value: "CDI", label: "CDI" },
          { value: "CDD", label: "CDD" },
          { value: "Stage", label: "Stage" },
          { value: "Freelance", label: "Freelance" },
          { value: "Temps partiel", label: "Temps partiel" },
          { value: "Non défini", label: "Non défini" },
        ],
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Description détaillée du poste",
      },
      {
        name: "phoneNumber",
        label: "Numéro de téléphone",
        type: "phone",
        required: true,
        placeholder: "Numéro sans indicatif et sans 0 initial (ex: 123456789)",
      },
      {
        name: "date_limite",
        label: "Date limite de candidature",
        type: "date",
      },
      {
        name: "email_contact",
        label: "Email de contact",
        type: "email",
        required: true,
        placeholder: "Email pour recevoir les candidatures",
      },
      {
        name: "offer_file",
        label: "Fichier de l'offre (PDF, max: 5Mo)",
        type: "file",
        accept: "application/pdf",
      },
      {
        name: "lien",
        label: "Lien",
        type: "url",
        placeholder: "Lien externe (site web, page de recrutement, etc.)",
      },
    ],

    businessOpportunity: [
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "opportunité", label: "Opportunité" },
          { value: "appel_projet", label: "Appel à projet" },
          { value: "partenariat", label: "Partenariat" },
        ],
      },
      {
        name: "entreprise",
        label: "Entreprise",
        type: "text",
        required: true,
        placeholder: "Nom de l'entreprise",
      },
      {
        name: "titre",
        label: "Titre",
        type: "text",
        required: true,
        placeholder: "Titre de votre opportunité d'affaires",
      },
      {
        name: "secteur",
        label: "Secteur d'activité",
        type: "text",
        required: true,
        placeholder: "Ex: Immobilier, E-commerce, Agriculture",
      },
      {
        name: "pays",
        label: "Pays",
        type: "country",
        required: true,
        placeholder: "Sélectionner un pays",
      },
      {
        name: "ville",
        label: "Ville",
        type: "text",
        required: true,
        placeholder: "Ex: Kinshasa",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Description détaillée de l'opportunité d'affaires",
      },
      {
        name: "phoneNumber",
        label: "Numéro de téléphone",
        type: "phone",
        required: true,
        placeholder: "Numéro sans indicatif et sans 0 initial (ex: 123456789)",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Email de contact",
      },
      {
        name: "reference",
        label: "Référence",
        type: "text",
        required: true,
        placeholder: "Ex: REF-123456",
      },
      {
        name: "date_limite",
        label: "Date limite",
        type: "date",
        placeholder: "Date limite pour postuler/investir",
      },
      {
        name: "opportunity_file",
        label: "Fichier de l'opportunité (PDF, max: 5Mo)",
        type: "file",
        accept: "application/pdf",
      },
      {
        name: "lien",
        label: "Lien",
        type: "url",
        placeholder: "Lien externe (site web, page de recrutement, etc.)",
      },
    ],
  };

  // Mettre à jour le champ caché des conditions de livraison lorsqu'elles changent
  useEffect(() => {
    if (type === "advertisement") {
      // S'assurer que conditionsLivraison est toujours un tableau
      const conditions = Array.isArray(conditionsLivraison)
        ? conditionsLivraison
        : [];
      setValue("conditions_livraison", conditions);
    }
  }, [conditionsLivraison, setValue, type]);

  // Précharger les données de la publication en mode édition
  useEffect(() => {
    if (isEditMode && initialData) {
      // Définir les valeurs spécifiques au type de publication
      if (type === "advertisement") {
        setValue("categorie", initialData.categorie);
        setValue("besoin_livreurs", initialData.besoin_livreurs || "NON");
        // Gérer les conditions de livraison comme un tableau
        // Traitement des conditions de livraison
        let conditions = [];
        if (initialData.conditions_livraison) {
          if (Array.isArray(initialData.conditions_livraison)) {
            conditions = initialData.conditions_livraison;
          } else if (typeof initialData.conditions_livraison === "string") {
            try {
              const parsed = JSON.parse(initialData.conditions_livraison);
              conditions = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              conditions =
                initialData.conditions_livraison.length > 0
                  ? [initialData.conditions_livraison]
                  : [];
            }
          }
        }
        setConditionsLivraison(conditions);
        setValue("conditions_livraison", conditions);
        setValue("point_vente", initialData.point_vente);
        setValue("quantite_disponible", initialData.quantite_disponible);
        setValue("prix_unitaire_vente", initialData.prix_unitaire_vente);
        setValue(
          "commission_livraison",
          initialData.commission_livraison || "NON"
        );
        setValue(
          "prix_unitaire_livraison",
          initialData.prix_unitaire_livraison
        );
      } else if (type === "jobOffer") {
        setValue("reference", initialData.reference);
        setValue("entreprise", initialData.entreprise);
        setValue("lieu", initialData.lieu);
        setValue("type_contrat", initialData.type_contrat);
        setValue("competences_requises", initialData.competences_requises);
        setValue("experience_requise", initialData.experience_requise);
        setValue("niveau_etudes", initialData.niveau_etudes);
        setValue("salaire", initialData.salaire);
        setValue("avantages", initialData.avantages);
        // Formater la date au format YYYY-MM-DD pour le champ input type="date"
        if (initialData.date_limite) {
          const date = new Date(initialData.date_limite);
          const formattedDate = date.toISOString().split("T")[0];
          setValue("date_limite", formattedDate);
        }
        setValue("email_contact", initialData.email_contact);
      } else if (type === "businessOpportunity") {
        setValue("secteur", initialData.secteur);
        setValue("entreprise", initialData.entreprise || "");
        setValue("benefices_attendus", initialData.benefices_attendus);
        setValue(
          "investissement_requis",
          initialData.investissement_requis ?? 0
        );
        setValue(
          "duree_retour_investissement",
          initialData.duree_retour_investissement
        );
        setValue("localisation", initialData.localisation);
        setValue("reference", initialData.reference || "");
        // Formater la date au format YYYY-MM-DD pour le champ input type="date"
        if (initialData.date_limite) {
          const date = new Date(initialData.date_limite);
          const formattedDate = date.toISOString().split("T")[0];
          setValue("date_limite", formattedDate);
        }
      }
    }
  }, [isEditMode, initialData, type, setValue]);

  // Vérifier les tailles maximales pour les fichiers
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2 Mo
        setImageError("L'image doit faire moins de 2Mo");
        return;
      }

      // Vérifier que c'est bien une image
      if (!file.type.startsWith("image/")) {
        setImageError("Le fichier sélectionné n'est pas une image valide");
        return;
      }

      setSelectedImage(file);
      setShowInitialImage(false); // Masquer l'image initiale s'il existe
      setImageError("");
    } else {
      setSelectedImage(null);
    }
  };

  // Fonction pour supprimer l'image sélectionnée
  const handleRemoveImage = () => {
    setSelectedImage(null);
    // Réinitialiser le champ de fichier
    const fileInput = document.getElementById("image");
    if (fileInput) fileInput.value = "";
  };

  // Fonction pour supprimer l'image initiale en mode édition
  const handleRemoveInitialImage = () => {
    setShowInitialImage(false);
    setInitialImageUrl(null);
    setInitialImageName("");
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10 Mo
        setVideoError("La vidéo doit faire moins de 10Mo");
        return;
      }

      // Vérifier que c'est bien une vidéo
      if (!file.type.startsWith("video/")) {
        setVideoError("Le fichier sélectionné n'est pas une vidéo valide");
        return;
      }

      setSelectedVideo(file);
      setShowInitialVideo(false); // Masquer la vidéo initiale s'il existe
      setVideoError("");
    } else {
      setSelectedVideo(null);
    }
  };

  // Fonction pour supprimer la vidéo sélectionnée
  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    // Réinitialiser le champ de fichier
    const fileInput = document.getElementById("video");
    if (fileInput) fileInput.value = "";
  };

  // Fonction pour supprimer la vidéo initiale en mode édition
  const handleRemoveInitialVideo = () => {
    setShowInitialVideo(false);
    setInitialVideoUrl(null);
    setInitialVideoName("");
  };

  const handleOpportunityPdfChange = (e) => {
    const file = e.target?.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        setPdfError("Seuls les fichiers PDF sont acceptés");
        setSelectedOpportunityPdf(null);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setPdfError("Le fichier ne doit pas dépasser 5MB");
        setSelectedOpportunityPdf(null);
        return;
      }

      setSelectedOpportunityPdf(file);
      setShowInitialOpportunityPdf(false);
      setPdfError("");
    } else {
      setSelectedOpportunityPdf(null);
    }
  };

  // Gestion du changement de fichier PDF
  const handlePdfChange = (e) => {
    const file = e.target?.files?.[0];

    if (file) {
      // Vérifier le type de fichier
      if (file.type !== "application/pdf") {
        setPdfError("Seuls les fichiers PDF sont acceptés");
        setSelectedPdf(null);
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPdfError("Le fichier ne doit pas dépasser 5MB");
        setSelectedPdf(null);
        return;
      }

      setSelectedPdf(file);
      setShowInitialOfferPdf(false); // Masquer le fichier initial s'il existe
      setPdfError("");
    } else {
      setSelectedPdf(null);
    }
  };

  // Fonction pour supprimer le fichier PDF sélectionné
  const handleRemoveOfferPdf = () => {
    setSelectedPdf(null);
    const offerFileInput = document.getElementById("offer_file");
    if (offerFileInput) offerFileInput.value = "";
  };

  const handleRemoveOpportunityPdf = () => {
    setSelectedOpportunityPdf(null);
    const opportunityFileInput = document.getElementById("opportunity_file");
    if (opportunityFileInput) opportunityFileInput.value = "";
  };

  // Fonction pour supprimer le fichier PDF initial en mode édition
  const handleRemoveInitialOfferPdf = () => {
    setShowInitialOfferPdf(false);
    setInitialPdfUrl(null);
    setInitialPdfName("");
  };

  const handleRemoveInitialOpportunityPdf = () => {
    setShowInitialOpportunityPdf(false);
    setInitialOpportunityUrl(null);
    setInitialOpportunityName("");
  };

  // Gestion de la soumission du formulaire
  const onFormSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      // Créer un FormData pour gérer les fichiers
      const data = new FormData();

      // Ajouter tous les champs du formulaire
      Object.keys(formData).forEach((key) => {
        // Ne pas ajouter les champs de fichiers, ils sont gérés séparément
        if (
          key !== "image" &&
          key !== "video" &&
          key !== "offer_file" &&
          key !== "opportunity_file"
        ) {
          // Ne pas ajouter les champs vides ou null
          if (
            formData[key] !== undefined &&
            formData[key] !== "" &&
            formData[key] !== null &&
            formData[key] !== "null"
          ) {
            data.append(key, formData[key]);
          }
        }
      });

      // Gestion de l'image
      if (selectedImage) {
        data.append("image", selectedImage);
      } else if (isEditMode && !showInitialImage && initialImageUrl) {
        data.append("remove_image", "1");
      }

      // Gestion de la vidéo
      if (selectedVideo) {
        data.append("video", selectedVideo);
      } else if (isEditMode && !showInitialVideo && initialVideoUrl) {
        data.append("remove_video", "1");
      }

      // Gestion du fichier PDF (offres d'emploi)
      if (selectedPdf) {
        data.append("offer_file", selectedPdf);
      } else if (isEditMode && !showInitialOfferPdf && initialPdfUrl) {
        data.append("remove_offer_file", "1");
      }

      // Gestion du fichier PDF (opportunités d'affaires)
      if (selectedOpportunityPdf) {
        data.append("opportunity_file", selectedOpportunityPdf);
      } else if (
        isEditMode &&
        !showInitialOpportunityPdf &&
        initialOpportunityUrl
      ) {
        data.append("remove_opportunity_file", "1");
      }

      // Configuration pour l'envoi de fichiers avec FormData
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Appeler la fonction onSubmit passée en prop avec le FormData
      await onSubmit(data, config);
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const onSubmitHandler = async (data) => {
    // Vérifier si le pack est actif avant de soumettre (sauf en mode édition)
    if (!isPackActive && !isEditMode) {
      return;
    }

    // Traiter explicitement les conditions de livraison
    if (conditionsLivraison && conditionsLivraison.length > 0) {
      // Filtrer les conditions vides
      const filteredConditions = conditionsLivraison.filter(
        (condition) => condition.trim() !== ""
      );

      // Assigner directement les conditions filtrées au formulaire
      if (filteredConditions.length > 0) {
        data.conditions_livraison = JSON.stringify(filteredConditions);
      } else {
        data.conditions_livraison = JSON.stringify([]);
      }
    } else {
      data.conditions_livraison = JSON.stringify([]);
    }

    try {
      // Préparer les données supplémentaires pour le formulaire
      // Concaténer l'indicatif téléphonique avec le numéro de téléphone
      const fullPhoneNumber = data.phoneNumber
        ? `${phoneCode} ${data.phoneNumber.trim()}`
        : "";

      // Ajouter le numéro de téléphone complet si nécessaire
      if (fullPhoneNumber) {
        data.contacts = fullPhoneNumber;
      }

      // Ajouter le statut et l'état pour les nouvelles publications
      if (!isEditMode) {
        data.statut = "en_attente";
        data.etat = "disponible";
      }

      // En mode édition, conserver l'ID
      if (isEditMode && initialData) {
        data.id = initialData.id;
      }

      // Utiliser la nouvelle fonction onFormSubmit pour gérer l'upload du fichier PDF
      // et la création du FormData avec la configuration correcte
      await onFormSubmit(data);

      // Notification de succès si tout s'est bien passé
      Notification.success(
        isEditMode
          ? "Publication modifiée avec succès"
          : "Publication soumise avec succès"
      );
    } catch (error) {
      // Message d'erreur détaillé
      let errorMessage =
        "Une erreur est survenue lors de la soumission du formulaire";

      // Extraire le message d'erreur de la réponse API si disponible
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Extraire la première erreur de validation
          const firstError = Object.values(error.response.data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Afficher la notification d'erreur avec le message approprié
      Notification.error(errorMessage);

      // Réinitialiser l'état de soumission pour permettre une nouvelle tentative
      setIsSubmitting(false);
    }
  };

  const getFields = () => {
    if (!type) return [];

    return formFields[type].filter((field) => {
      // Exclure le champ pays car il sera rendu en dur dans le formulaire
      if (field.name === "pays") {
        return false;
      }

      if (field.show) {
        const values = {};
        if (type === "advertisement") {
          values.categorie = watchCategorie;
          values.besoin_livreurs = watchBesoinLivreurs;
        }
        return field.show(values);
      }
      return true;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {!isPackActive && (
        <PublicationPackAlert isActive={isPackActive} packInfo={packInfo} />
      )}
      {isEditMode && (
        <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-200">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            <span>
              Vous êtes en train de modifier une publication en attente
              d'approbation.
            </span>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon
                  className="h-5 w-5 text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Votre publication sera soumise à validation par l'équipe
                  d'administration avant d'être visible publiquement.
                </p>
              </div>
            </div>
          </div>

          {/* Champ pays rendu en dur pour tous les types de formulaire */}
          <div className="space-y-2">
            <label
              htmlFor="pays"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Pays
              <span className="text-red-500 ml-1">*</span>
            </label>
            <CountrySelector
              value={watch("pays")}
              onChange={(value) => setValue("pays", value)}
              placeholder="Sélectionner un pays"
            />
            {errors.pays && (
              <p className="mt-1 text-sm text-red-600">{errors.pays.message}</p>
            )}
          </div>

          {getFields().map((field) => (
            <div key={field.name} className="space-y-2">
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === "select" && (
                <select
                  id={field.name}
                  {...register(field.name, {
                    required: field.required && `${field.label} est requis`,
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "textarea" && (
                <textarea
                  id={field.name}
                  {...register(field.name, {
                    required: field.required && `${field.label} est requis`,
                  })}
                  rows={4}
                  placeholder={field.placeholder || ""}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              )}

              {field.type === "country" && (
                <CountrySelector
                  value={watch(field.name)}
                  onChange={(value) => setValue(field.name, value)}
                  placeholder={field.placeholder || "Sélectionner un pays"}
                />
              )}

              {field.type === "phone" && (
                <>
                  <div className="flex space-x-2">
                    <div className="w-2/5">
                      <CountryCodeSelector
                        onChange={setPhoneCode}
                        value={phoneCode}
                      />
                    </div>
                    <div className="w-3/5">
                      <input
                        type="tel"
                        id={field.name}
                        {...register(field.name, {
                          required:
                            field.required && `${field.label} est requis`,
                          pattern: {
                            value: /^[1-9][0-9\s]*$/,
                            message:
                              "Veuillez saisir uniquement des chiffres sans 0 au début",
                          },
                        })}
                        placeholder={field.placeholder || ""}
                        className={`block w-full px-3 py-2 border ${
                          errors[field.name]
                            ? "border-red-500 dark:border-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                      />
                    </div>
                  </div>
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors[field.name].message}
                    </p>
                  )}
                </>
              )}

              {field.type === "file" && field.name === "image" && (
                <div>
                  {/* Afficher l'image initiale en mode édition */}
                  {isEditMode && showInitialImage && (
                    <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">
                              Image actuelle:
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                              "{initialImageName}"
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {initialImageUrl && (
                            <a
                              href={initialImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Voir
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveInitialImage}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            title="Supprimer l'image"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de sélection de fichier (affichée si pas de fichier initial ou si le fichier initial a été supprimé) */}
                  {(!isEditMode || !showInitialImage) && (
                    <div>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Image jusqu'à 2 Mo (optionnel)
                      </p>
                      {imageError && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          {imageError}
                        </p>
                      )}
                      {selectedImage && (
                        <div className="flex items-center justify-center mt-2">
                          <p className="text-xs text-green-500 dark:text-green-400 mr-2">
                            <CheckCircleIcon className="inline-block h-4 w-4 mr-1" />
                            {selectedImage.name}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {field.type === "file" && field.name === "video" && (
                <div>
                  {/* Afficher la vidéo initiale en mode édition */}
                  {isEditMode && showInitialVideo && (
                    <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">
                              Vidéo actuelle:
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                              "{initialVideoName}"
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {initialVideoUrl && (
                            <a
                              href={initialVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Voir
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveInitialVideo}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            title="Supprimer la vidéo"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de sélection de fichier (affichée si pas de fichier initial ou si le fichier initial a été supprimé) */}
                  {(!isEditMode || !showInitialVideo) && (
                    <div>
                      <input
                        type="file"
                        id="video"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Vidéo jusqu'à 5 Mo (optionnel)
                      </p>
                      {videoError && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          {videoError}
                        </p>
                      )}
                      {selectedVideo && (
                        <div className="flex items-center justify-center mt-2">
                          <p className="text-xs text-green-500 dark:text-green-400 mr-2">
                            <CheckCircleIcon className="inline-block h-4 w-4 mr-1" />
                            {selectedVideo.name}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveVideo}
                            className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {field.type === "file" && field.name === "offer_file" && (
                <div>
                  {/* Afficher le fichier PDF initial en mode édition */}
                  {isEditMode && showInitialOfferPdf && (
                    <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">
                              Fichier PDF actuel:
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                              "{initialPdfName}"
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {initialPdfUrl && (
                            <a
                              href={initialPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Voir
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveInitialOfferPdf}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            title="Supprimer le fichier PDF"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de sélection de fichier (affichée si pas de fichier initial ou si le fichier initial a été supprimé) */}
                  {(!isEditMode || !showInitialOfferPdf) && (
                    <div
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md dark:bg-gray-800 transition-colors duration-200"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          const fileInput = document.getElementById(field.name);
                          fileInput.files = files;
                          handlePdfChange({ target: { files: files } });
                        }
                      }}
                    >
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                          <label
                            htmlFor={field.name}
                            className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Choisir un fichier</span>
                            <input
                              id={field.name}
                              name={field.name}
                              type="file"
                              className="sr-only"
                              accept={field.accept}
                              onChange={handlePdfChange}
                            />
                          </label>
                          <p className="pl-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF jusqu'à 5 Mo (optionnel)
                        </p>
                        {pdfError && (
                          <p className="text-xs text-red-500 dark:text-red-400">
                            {pdfError}
                          </p>
                        )}
                        {selectedPdf && (
                          <div className="flex items-center justify-center mt-2">
                            <p className="text-xs text-green-500 dark:text-green-400 mr-2">
                              <CheckCircleIcon className="inline-block h-4 w-4 mr-1" />
                              {selectedPdf.name}
                            </p>
                            <button
                              type="button"
                              onClick={handleRemoveOfferPdf}
                              className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {field.type === "file" && field.name === "opportunity_file" && (
                <div>
                  {/* Afficher le fichier PDF initial en mode édition */}
                  {isEditMode && showInitialOpportunityPdf && (
                    <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">
                              Fichier PDF actuel:
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                              "{initialOpportunityName}"
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {initialOpportunityUrl && (
                            <a
                              href={initialOpportunityUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Voir
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveInitialOpportunityPdf}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            title="Supprimer le fichier PDF"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de sélection de fichier (affichée si pas de fichier initial ou si le fichier initial a été supprimé) */}
                  {(!isEditMode || !showInitialOpportunityPdf) && (
                    <div
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md dark:bg-gray-800 transition-colors duration-200"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          const fileInput = document.getElementById(field.name);
                          fileInput.files = files;
                          handleOpportunityPdfChange({
                            target: { files: files },
                          });
                        }
                      }}
                    >
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                          <label
                            htmlFor={field.name}
                            className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Choisir un fichier</span>
                            <input
                              id={field.name}
                              name={field.name}
                              type="file"
                              className="sr-only"
                              accept={field.accept}
                              onChange={handleOpportunityPdfChange}
                            />
                          </label>
                          <p className="pl-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF jusqu'à 5 Mo (optionnel)
                        </p>
                        {pdfError && (
                          <p className="text-xs text-red-500 dark:text-red-400">
                            {pdfError}
                          </p>
                        )}
                        {selectedOpportunityPdf && (
                          <div className="flex items-center justify-center mt-2">
                            <p className="text-xs text-green-500 dark:text-green-400 mr-2">
                              <CheckCircleIcon className="inline-block h-4 w-4 mr-1" />
                              {selectedOpportunityPdf.name}
                            </p>
                            <button
                              type="button"
                              onClick={handleRemoveOpportunityPdf}
                              className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {field.type === "custom" &&
                field.name === "conditions_livraison" && (
                  <div className="mt-1">
                    {/* Liste des champs de conditions existants */}
                    {conditionsLivraison.map((condition, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          value={condition}
                          onChange={(e) => {
                            const newConditions = [...conditionsLivraison];
                            newConditions[index] = e.target.value;
                            setConditionsLivraison(newConditions);
                          }}
                        />
                        <button
                          type="button"
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={() => {
                            const newConditions = [...conditionsLivraison];
                            newConditions.splice(index, 1);
                            setConditionsLivraison(newConditions);
                          }}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}

                    {/* Bouton pour ajouter un nouveau champ */}
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        setConditionsLivraison([...conditionsLivraison, ""]);
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Ajouter une condition de livraison
                    </button>

                    {/* Champ caché pour stocker la valeur dans le formulaire */}
                    <input
                      type="hidden"
                      id={field.name}
                      {...register(field.name)}
                      value={JSON.stringify(conditionsLivraison)}
                      style={{ display: "none" }}
                    />
                    {/* Mettre à jour la valeur du champ caché lorsque les conditions changent */}
                  </div>
                )}

              {!["select", "textarea", "file", "custom", "phone"].includes(
                field.type
              ) &&
                field.name !== "conditions_livraison" && (
                  <input
                    id={field.name}
                    type={field.type}
                    {...register(field.name, {
                      required: field.required && `${field.label} est requis`,
                    })}
                    placeholder={field.placeholder || ""}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                )}

              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.name].message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm py-2 px-4 bg-gray-500 hover:bg-gray-600 rounded-md"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || imageError || videoError || pdfError}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              isSubmitting || imageError || videoError || pdfError
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center">
                {isEditMode ? "Modifier" : "Soumettre"}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
