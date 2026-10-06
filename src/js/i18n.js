import { derived, get, writable } from "svelte/store";
import { getPreference, setPreference } from "./lib/utils/main.js";
import dictionaries from "./i18n/index.js";
import howTo from "./i18n/howto.js";

export const LANGUAGES = [
  { code: "en", nativeName: "English" },
  { code: "fr", nativeName: "Français" },
  { code: "es", nativeName: "Español" },
  { code: "de", nativeName: "Deutsch" },
  { code: "hi", nativeName: "हिन्दी" },
];

const translations = {
  en: {
    language: "Language",
    chooseLanguage: "Choose your language",
    chooseLanguageDescription: "You can change this later in ExcaliburFX folder (Documents/Excalibur/preferences.json/'language').",
    continue: "Continue",
    loading: "Loading you in...",
    settings: "Settings",
    dashboard: "Dashboard",
    curves: "Curve",
    workflow: "Workflow",
    effects: "Effects",
    colors: "Colors",
    sfx: "SFX",
    scripts: "Scripts",
    ffmpeg: "FFMPEG",
    shakes: "SHAKES",
    uiSettings: "UI Settings",
    shortcuts: "Shortcuts",
    panelOptions: "Panel Options",
    manageMenus: "Manage Menus",
    layerColors: "Layer Colors",
    reset: "Reset",
    restart: "Restart EbFX",
    clearCache: "Clear Ae Disk Cache",
    openNewInstance: "Open in a new instance",
    deleteUnused: "Delete unused items",
    sortProject: "Sort Project",
    noAnimation: "No animation",
    defaultAnimation: "Default animation",
    maxAnimation: "Max animation",
    enableRgb: "Enable RGB mode",
    disableIconAnimations: "Disable all icon animations",
    enableDiscord: "Enable Discord RPC",
    offline: "You are offline",
  },
  fr: {
    language: "Langue",
    chooseLanguage: "Choisissez votre langue",
    chooseLanguageDescription: "Vous pourrez la modifier plus tard dans .",
    continue: "Continuer",
    loading: "Chargement...",
    settings: "Paramètres",
    dashboard: "Tableau de bord",
    curves: "Courbe",
    workflow: "Workflow",
    effects: "Effets",
    colors: "Couleurs",
    sfx: "SFX",
    scripts: "Scripts",
    ffmpeg: "FFMPEG",
    shakes: "SHAKES",
    uiSettings: "Paramètres de l'interface",
    shortcuts: "Raccourcis",
    panelOptions: "Options du panneau",
    manageMenus: "Gérer les menus",
    layerColors: "Couleurs des calques",
    reset: "Réinitialiser",
    restart: "Redémarrer EbFX",
    clearCache: "Vider le cache disque d'AE",
    openNewInstance: "Ouvrir dans une nouvelle instance",
    deleteUnused: "Supprimer les éléments inutilisés",
    sortProject: "Trier le projet",
    noAnimation: "Aucune animation",
    defaultAnimation: "Animation par défaut",
    maxAnimation: "Animation maximale",
    enableRgb: "Activer le mode RGB",
    disableIconAnimations: "Désactiver les animations des icônes",
    enableDiscord: "Activer Discord RPC",
    offline: "Vous êtes hors ligne",
  },
  es: {
    language: "Idioma",
    chooseLanguage: "Elige tu idioma",
    chooseLanguageDescription: "Puedes cambiarlo más tarde en Ajustes.",
    continue: "Continuar",
    loading: "Cargando...",
    settings: "Ajustes",
    dashboard: "Panel",
    curves: "Curva",
    workflow: "Flujo de trabajo",
    effects: "Efectos",
    colors: "Colores",
    sfx: "SFX",
    scripts: "Scripts",
    ffmpeg: "FFMPEG",
    shakes: "SHAKES",
    uiSettings: "Ajustes de la interfaz",
    shortcuts: "Atajos",
    panelOptions: "Opciones del panel",
    manageMenus: "Gestionar menús",
    layerColors: "Colores de capas",
    reset: "Restablecer",
    restart: "Reiniciar EbFX",
    clearCache: "Borrar caché de disco de AE",
    openNewInstance: "Abrir en una nueva instancia",
    deleteUnused: "Eliminar elementos no usados",
    sortProject: "Ordenar proyecto",
    noAnimation: "Sin animación",
    defaultAnimation: "Animación predeterminada",
    maxAnimation: "Animación máxima",
    enableRgb: "Activar modo RGB",
    disableIconAnimations: "Desactivar animaciones de iconos",
    enableDiscord: "Activar Discord RPC",
    offline: "Estás sin conexión",
  },
  de: {
    language: "Sprache",
    chooseLanguage: "Sprache auswählen",
    chooseLanguageDescription: "Du kannst dies später in den Einstellungen ändern.",
    continue: "Weiter",
    loading: "Wird geladen...",
    settings: "Einstellungen",
    dashboard: "Übersicht",
    curves: "Kurve",
    workflow: "Workflow",
    effects: "Effekte",
    colors: "Farben",
    sfx: "SFX",
    scripts: "Skripte",
    ffmpeg: "FFMPEG",
    shakes: "SHAKES",
    uiSettings: "Oberflächeneinstellungen",
    shortcuts: "Verknüpfungen",
    panelOptions: "Paneloptionen",
    manageMenus: "Menüs verwalten",
    layerColors: "Ebenenfarben",
    reset: "Zurücksetzen",
    restart: "EbFX neu starten",
    clearCache: "AE-Festplattencache leeren",
    openNewInstance: "In neuer Instanz öffnen",
    deleteUnused: "Nicht verwendete Elemente löschen",
    sortProject: "Projekt sortieren",
    noAnimation: "Keine Animation",
    defaultAnimation: "Standardanimation",
    maxAnimation: "Maximale Animation",
    enableRgb: "RGB-Modus aktivieren",
    disableIconAnimations: "Symbolanimationen deaktivieren",
    enableDiscord: "Discord RPC aktivieren",
    offline: "Du bist offline",
  },
  hi: {
    language: "भाषा",
    chooseLanguage: "अपनी भाषा चुनें",
    chooseLanguageDescription: "आप इसे बाद में सेटिंग्स में बदल सकते हैं।",
    continue: "जारी रखें",
    loading: "लोड हो रहा है...",
    settings: "सेटिंग्स",
    dashboard: "डैशबोर्ड",
    curves: "कर्व",
    workflow: "वर्कफ़्लो",
    effects: "इफ़ेक्ट्स",
    colors: "रंग",
    sfx: "SFX",
    scripts: "स्क्रिप्ट",
    ffmpeg: "FFMPEG",
    shakes: "SHAKES",
    uiSettings: "इंटरफ़ेस सेटिंग्स",
    shortcuts: "शॉर्टकट",
    panelOptions: "पैनल विकल्प",
    manageMenus: "मेनू प्रबंधित करें",
    layerColors: "लेयर के रंग",
    reset: "रीसेट",
    restart: "EbFX पुनः आरंभ करें",
    clearCache: "AE डिस्क कैश साफ़ करें",
    openNewInstance: "नए इंस्टेंस में खोलें",
    deleteUnused: "अनुपयोगी आइटम हटाएँ",
    sortProject: "प्रोजेक्ट क्रमित करें",
    noAnimation: "कोई एनीमेशन नहीं",
    defaultAnimation: "डिफ़ॉल्ट एनीमेशन",
    maxAnimation: "अधिकतम एनीमेशन",
    enableRgb: "RGB मोड सक्षम करें",
    disableIconAnimations: "आइकन एनीमेशन अक्षम करें",
    enableDiscord: "Discord RPC सक्षम करें",
    offline: "आप ऑफ़लाइन हैं",
  },
};

const tabTextTranslations = {
  "All": { fr: "Tous", es: "Todo", de: "Alle", hi: "सभी" },
  "Cancel": { fr: "Annuler", es: "Cancelar", de: "Abbrechen", hi: "रद्द करें" },
  "Save": { fr: "Enregistrer", es: "Guardar", de: "Speichern", hi: "सहेजें" },
  "Back": { fr: "Retour", es: "Atrás", de: "Zurück", hi: "वापस" },
  "Add new": { fr: "Ajouter", es: "Añadir", de: "Neu hinzufügen", hi: "नया जोड़ें" },
  "Remove": { fr: "Supprimer", es: "Eliminar", de: "Entfernen", hi: "हटाएँ" },
  "Paste": { fr: "Coller", es: "Pegar", de: "Einfügen", hi: "चिपकाएँ" },
  "Copy all": { fr: "Tout copier", es: "Copiar todo", de: "Alles kopieren", hi: "सभी कॉपी करें" },
  "Reset": { fr: "Réinitialiser", es: "Restablecer", de: "Zurücksetzen", hi: "रीसेट" },
  "Loading Colors...": { fr: "Chargement des couleurs...", es: "Cargando colores...", de: "Farben werden geladen...", hi: "रंग लोड हो रहे हैं..." },
  "No blocks found.": { fr: "Aucun bloc trouvé.", es: "No se encontraron bloques.", de: "Keine Blöcke gefunden.", hi: "कोई ब्लॉक नहीं मिला।" },
  "No effects found.": { fr: "Aucun effet trouvé.", es: "No se encontraron efectos.", de: "Keine Effekte gefunden.", hi: "कोई इफ़ेक्ट नहीं मिला।" },
  "No matches found for your search.": { fr: "Aucun résultat pour votre recherche.", es: "No se encontraron coincidencias.", de: "Keine Treffer für deine Suche.", hi: "आपकी खोज का कोई परिणाम नहीं मिला।" },
  "No presets found.": { fr: "Aucun préréglage trouvé.", es: "No se encontraron ajustes preestablecidos.", de: "Keine Voreinstellungen gefunden.", hi: "कोई प्रीसेट नहीं मिला।" },
  "No scripts match your criteria.": { fr: "Aucun script ne correspond à vos critères.", es: "Ningún script coincide con tus criterios.", de: "Keine Skripte entsprechen deinen Kriterien.", hi: "कोई स्क्रिप्ट आपके मानदंड से मेल नहीं खाती।" },
  "No sounds found.": { fr: "Aucun son trouvé.", es: "No se encontraron sonidos.", de: "Keine Sounds gefunden.", hi: "कोई ध्वनि नहीं मिली।" },
  "Open in a new instance": { fr: "Ouvrir dans une nouvelle instance", es: "Abrir en una instancia nueva", de: "In neuer Instanz öffnen", hi: "नए इंस्टेंस में खोलें" },
  "Delete unused items": { fr: "Supprimer les éléments inutilisés", es: "Eliminar elementos no usados", de: "Nicht verwendete Elemente löschen", hi: "अनुपयोगी आइटम हटाएँ" },
  "Sort Project": { fr: "Trier le projet", es: "Ordenar proyecto", de: "Projekt sortieren", hi: "प्रोजेक्ट क्रमित करें" },
  "Panel Options": { fr: "Options du panneau", es: "Opciones del panel", de: "Paneloptionen", hi: "पैनल विकल्प" },
  "Shortcuts": { fr: "Raccourcis", es: "Atajos", de: "Verknüpfungen", hi: "शॉर्टकट" },
  "Manage Menus": { fr: "Gérer les menus", es: "Gestionar menús", de: "Menüs verwalten", hi: "मेनू प्रबंधित करें" },
  "Layer Colors": { fr: "Couleurs des calques", es: "Colores de capas", de: "Ebenenfarben", hi: "लेयर के रंग" },
  "SFX volume": { fr: "Volume SFX", es: "Volumen SFX", de: "SFX-Lautstärke", hi: "SFX वॉल्यूम" },
  "Show FPS": { fr: "Afficher les FPS", es: "Mostrar FPS", de: "FPS anzeigen", hi: "FPS दिखाएँ" },
  "Vertical mode": { fr: "Mode vertical", es: "Modo vertical", de: "Vertikaler Modus", hi: "वर्टिकल मोड" },
  "Compact sidebar": { fr: "Barre latérale compacte", es: "Barra lateral compacta", de: "Kompakte Seitenleiste", hi: "कॉम्पैक्ट साइडबार" },
  "Enable hover preview": { fr: "Activer l'aperçu au survol", es: "Activar vista previa al pasar", de: "Vorschau beim Darüberfahren", hi: "होवर प्रीव्यू सक्षम करें" },
  "Loop preview": { fr: "Lire l'aperçu en boucle", es: "Repetir vista previa", de: "Vorschau wiederholen", hi: "प्रीव्यू दोहराएँ" },
  "At current cursor": { fr: "Au curseur actuel", es: "En el cursor actual", de: "Am aktuellen Cursor", hi: "वर्तमान कर्सर पर" },
  "At highest audio peak": { fr: "Au pic audio le plus élevé", es: "En el pico de audio más alto", de: "Am höchsten Audio-Peak", hi: "सबसे ऊँचे ऑडियो पीक पर" },
  "Apply effects tabs on ADJ layer": { fr: "Mettre les effets sur un ADJ Layer", es: "Aplicar en la capa de ajuste", de: "Auf Einstellungsebene anwenden", hi: "एडजस्टमेंट लेयर पर लागू करें" },
  "Create layer on each selected": { fr: "Un calques par sélection", es: "Crear una capa por cada selección", de: "Ebene für jede Auswahl erstellen", hi: "हर चयन पर लेयर बनाएँ" },
  "Detailed analysis": { fr: "Analyse détaillée", es: "Análisis detallado", de: "Detaillierte Analyse", hi: "विस्तृत विश्लेषण" },
  "Fast analysis": { fr: "Analyse rapide", es: "Análisis rápido", de: "Schnelle Analyse", hi: "त्वरित विश्लेषण" },
  "Native effects": { fr: "Effets natifs", es: "Efectos nativos", de: "Native Effekte", hi: "मूल इफ़ेक्ट्स" },
  "Presets": { fr: "Préréglages", es: "Ajustes preestablecidos", de: "Voreinstellungen", hi: "प्रीसेट" },
  "Description": { fr: "Description", es: "Descripción", de: "Beschreibung", hi: "विवरण" },
  "Name": { fr: "Nom", es: "Nombre", de: "Name", hi: "नाम" },
  "Category": { fr: "Catégorie", es: "Categoría", de: "Kategorie", hi: "श्रेणी" },
  "Amount": { fr: "Quantité", es: "Cantidad", de: "Menge", hi: "मात्रा" },
  "Speed": { fr: "Vitesse", es: "Velocidad", de: "Geschwindigkeit", hi: "गति" },
  "Strength": { fr: "Force", es: "Intensidad", de: "Stärke", hi: "तीव्रता" },
  "Duration": { fr: "Durée", es: "Duración", de: "Dauer", hi: "अवधि" },
  "Width": { fr: "Largeur", es: "Anchura", de: "Breite", hi: "चौड़ाई" },
  "Height": { fr: "Hauteur", es: "Altura", de: "Höhe", hi: "ऊँचाई" },
  "Format": { fr: "Format", es: "Formato", de: "Format", hi: "प्रारूप" },
  "Value": { fr: "Valeur", es: "Valor", de: "Wert", hi: "मान" },
  "Mode": { fr: "Mode", es: "Modo", de: "Modus", hi: "मोड" },
  "Add key": { fr: "Ajouter une clé", es: "Añadir clave", de: "Schlüssel hinzufügen", hi: "की जोड़ें" },
  "Add keyframe": { fr: "Ajouter une image clé", es: "Añadir fotograma clave", de: "Keyframe hinzufügen", hi: "कीफ़्रेम जोड़ें" },
  "Add Preset/Plugin": { fr: "Ajouter un préréglage/plug-in", es: "Añadir ajuste/plugin", de: "Voreinstellung/Plugin hinzufügen", hi: "प्रीसेट/प्लगइन जोड़ें" },
  "Adjustment Layer": { fr: "Calque d'effets", es: "Capa de ajuste", de: "Einstellungsebene", hi: "एडजस्टमेंट लेयर" },
  "All effects": { fr: "Tous les effets", es: "Todos los efectos", de: "Alle Effekte", hi: "सभी इफ़ेक्ट्स" },
  "Animate property": { fr: "Animer la propriété", es: "Animar propiedad", de: "Eigenschaft animieren", hi: "प्रॉपर्टी को एनीमेट करें" },
  "Audio Beat Marker": { fr: "Marqueur de rythme audio", es: "Marcador de ritmo de audio", de: "Audio-Beat-Marker", hi: "ऑडियो बीट मार्कर" },
  "Auto Beat Mark": { fr: "Marquage automatique des temps", es: "Marcado automático de beats", de: "Automatische Beat-Markierung", hi: "ऑटो बीट मार्क" },
  "Auto Cut": { fr: "Coupe automatique", es: "Corte automático", de: "Automatischer Schnitt", hi: "ऑटो कट" },
  "Border framing": { fr: "Cadre des bordures", es: "Encuadre del borde", de: "Randrahmen", hi: "बॉर्डर फ्रेमिंग" },
  "Brightness": { fr: "Luminosité", es: "Brillo", de: "Helligkeit", hi: "चमक" },
  "Camera": { fr: "Caméra", es: "Cámara", de: "Kamera", hi: "कैमरा" },
  "Chain Builder": { fr: "Constructeur de chaîne", es: "Constructor de cadenas", de: "Ketten-Builder", hi: "चेन बिल्डर" },
  "Changelog:": { fr: "Journal des changements :", es: "Cambios:", de: "Änderungsprotokoll:", hi: "परिवर्तन लॉग:" },
  "Check for update": { fr: "Rechercher des mises à jour", es: "Buscar actualizaciones", de: "Nach Updates suchen", hi: "अपडेट जाँचें" },
  "Contrast": { fr: "Contraste", es: "Contraste", de: "Kontrast", hi: "कंट्रास्ट" },
  "Create Custom Script": { fr: "Créer un script personnalisé", es: "Crear script personalizado", de: "Benutzerdefiniertes Skript erstellen", hi: "कस्टम स्क्रिप्ट बनाएँ" },
  "Create FX Control Rig": { fr: "Créer un rig de contrôle FX", es: "Crear rig de control FX", de: "FX-Steuerungs-Rig erstellen", hi: "FX कंट्रोल रिग बनाएँ" },
  "Current Version:": { fr: "Version actuelle :", es: "Versión actual:", de: "Aktuelle Version:", hi: "वर्तमान संस्करण:" },
  "Cut sensitivity": { fr: "Sensibilité de coupe", es: "Sensibilidad de corte", de: "Schnittsensitivität", hi: "कट संवेदनशीलता" },
  "Dashboard & News": { fr: "Tableau de bord et actualités", es: "Panel y novedades", de: "Übersicht und Neuigkeiten", hi: "डैशबोर्ड और समाचार" },
  "Delete All": { fr: "Tout supprimer", es: "Eliminar todo", de: "Alle löschen", hi: "सभी हटाएँ" },
  "Detail Effect Settings": { fr: "Paramètres détaillés de l'effet", es: "Ajustes detallados del efecto", de: "Detaillierte Effekteinstellungen", hi: "इफ़ेक्ट की विस्तृत सेटिंग्स" },
  "Effects Builder": { fr: "Constructeur d'effets", es: "Constructor de efectos", de: "Effekte-Builder", hi: "इफ़ेक्ट बिल्डर" },
  "Export folder": { fr: "Dossier d'exportation", es: "Carpeta de exportación", de: "Exportordner", hi: "एक्सपोर्ट फ़ोल्डर" },
  "Fade In": { fr: "Fondu entrant", es: "Atenuación de entrada", de: "Einblenden", hi: "फेड इन" },
  "Fade Out": { fr: "Fondu sortant", es: "Atenuación de salida", de: "Ausblenden", hi: "फेड आउट" },
  "Folders": { fr: "Dossiers", es: "Carpetas", de: "Ordner", hi: "फ़ोल्डर" },
  "Frame rate": { fr: "Fréquence d'images", es: "Frecuencia de fotogramas", de: "Bildrate", hi: "फ़्रेम दर" },
  "Include Effects": { fr: "Inclure les effets", es: "Incluir efectos", de: "Effekte einschließen", hi: "इफ़ेक्ट्स शामिल करें" },
  "Layers": { fr: "Calques", es: "Capas", de: "Ebenen", hi: "लेयर" },
  "Live Curve": { fr: "Courbe en direct", es: "Curva en vivo", de: "Live-Kurve", hi: "लाइव कर्व" },
  "Main sliders only": { fr: "Curseurs principaux uniquement", es: "Solo controles principales", de: "Nur Hauptregler", hi: "केवल मुख्य स्लाइडर" },
  "Motion Tile": { fr: "Mosaïque", es: "Mosaico", de: "Bewegungsmosaik", hi: "मोशन टाइल" },
  "No active sequence found.": { fr: "Aucune séquence active trouvée.", es: "No se encontró ninguna secuencia activa.", de: "Keine aktive Sequenz gefunden.", hi: "कोई सक्रिय सीक्वेंस नहीं मिली।" },
  "Presets & Library": { fr: "Préréglages et bibliothèque", es: "Ajustes y biblioteca", de: "Voreinstellungen und Bibliothek", hi: "प्रीसेट और लाइब्रेरी" },
  "Remove animation": { fr: "Supprimer l'animation", es: "Eliminar animación", de: "Animation entfernen", hi: "एनीमेशन हटाएँ" },
  "Rotation +": { fr: "Rotation +", es: "Rotación +", de: "Drehung +", hi: "रोटेशन +" },
  "Rotation -": { fr: "Rotation -", es: "Rotación -", de: "Drehung -", hi: "रोटेशन -" },
  "Scale": { fr: "Échelle", es: "Escala", de: "Skalierung", hi: "स्केल" },
  "Scan Subcompositions": { fr: "Analyser les sous-compositions", es: "Analizar subcomposiciones", de: "Unterkompositionen durchsuchen", hi: "सब-कंपोज़िशन स्कैन करें" },
  "Script Code": { fr: "Code du script", es: "Código del script", de: "Skriptcode", hi: "स्क्रिप्ट कोड" },
  "Smoothness": { fr: "Lissage", es: "Suavidad", de: "Glätte", hi: "स्मूदनेस" },
  "Snap to nearest marker": { fr: "Accrocher au marqueur le plus proche", es: "Ajustar al marcador más cercano", de: "Am nächsten Marker einrasten", hi: "निकटतम मार्कर पर स्नैप करें" },
  "Text": { fr: "Texte", es: "Texto", de: "Text", hi: "टेक्स्ट" },
  "Transform": { fr: "Transformation", es: "Transformación", de: "Transformation", hi: "ट्रांसफ़ॉर्म" },
  "Update Available": { fr: "Mise à jour disponible", es: "Actualización disponible", de: "Update verfügbar", hi: "अपडेट उपलब्ध है" },
  "Utilities": { fr: "Utilitaires", es: "Utilidades", de: "Werkzeuge", hi: "उपयोगिताएँ" },
  "Warp Stabilizer": { fr: "Stabilisateur de déformation", es: "Estabilizador de deformación", de: "Verkrümmungsstabilisator", hi: "वॉर्प स्टेबलाइज़र" },
  "Your chain is empty.": { fr: "Votre chaîne est vide.", es: "Tu cadena está vacía.", de: "Deine Kette ist leer.", hi: "आपकी चेन खाली है।" },
  "Your Library": { fr: "Votre bibliothèque", es: "Tu biblioteca", de: "Deine Bibliothek", hi: "आपकी लाइब्रेरी" },
  "Your Presets": { fr: "Vos préréglages", es: "Tus ajustes preestablecidos", de: "Deine Voreinstellungen", hi: "आपके प्रीसेट" },
  "Effects loaded:": { fr: "Effets chargés :", es: "Efectos cargados:", de: "Effekte geladen:", hi: "इफ़ेक्ट्स लोड हुए:" },
  "Elements in library:": { fr: "Éléments dans la bibliothèque :", es: "Elementos en la biblioteca:", de: "Elemente in der Bibliothek:", hi: "लाइब्रेरी में आइटम:" },
  "Presets loaded:": { fr: "Préréglages chargés :", es: "Ajustes cargados:", de: "Voreinstellungen geladen:", hi: "प्रीसेट लोड हुए:" },
  "Preset Folder:": { fr: "Dossier des préréglages :", es: "Carpeta de ajustes:", de: "Voreinstellungsordner:", hi: "प्रीसेट फ़ोल्डर:" },
  "Current Version:": { fr: "Version actuelle :", es: "Versión actual:", de: "Aktuelle Version:", hi: "वर्तमान संस्करण:" },
  "New Version:": { fr: "Nouvelle version :", es: "Nueva versión:", de: "Neue Version:", hi: "नया संस्करण:" },
  "Syncing with After Effects...": { fr: "Synchronisation avec After Effects...", es: "Sincronizando con After Effects...", de: "Synchronisierung mit After Effects...", hi: "After Effects के साथ सिंक हो रहा है..." },
  "Put your mouse over the shakes to preview them.": { fr: "Survolez les shakes pour les prévisualiser.", es: "Pasa el ratón sobre los shakes para previsualizarlos.", de: "Bewege die Maus über die Shakes für eine Vorschau.", hi: "प्रीव्यू देखने के लिए शेक पर माउस रखें।" },
  "Delete mode is active": { fr: "Le mode suppression est actif", es: "El modo de eliminación está activo", de: "Der Löschmodus ist aktiv", hi: "डिलीट मोड सक्रिय है" },
};
const CODES = ["fr", "es", "de", "hi"];
const PLACEHOLDER = /\{(\d+)\}/g;
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const patterns = [];

Object.keys(tabTextTranslations).forEach((source) => {
  Object.keys(translations).forEach((code) => {
    if (code === "en") translations[code][source] = source;
    else if (tabTextTranslations[source][code]) translations[code][source] = tabTextTranslations[source][code];
  });
});

function compilePattern(source, values) {
  const order = [];
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/\\\{(\d+)\\\}/g, (_, n) => {
    order.push(Number(n));
    return "(.+?)";
  });
  return {
    re: new RegExp("^" + body + "$"),
    order,
    values,
    weight: source.replace(PLACEHOLDER, "").length,
  };
}

function registerDictionary(dictionary) {
  Object.keys(dictionary).forEach((source) => {
    const values = dictionary[source];
    if (/\{\d+\}/.test(source)) {
      patterns.push(compilePattern(source, values));
      return;
    }
    CODES.forEach((code, i) => {
      if (values[i]) translations[code][source] = values[i];
    });
  });
  patterns.sort((a, b) => b.weight - a.weight);
}
dictionaries.forEach(registerDictionary);

function innerTranslate(code, text, depth) {
  if (depth > 1) return text;
  const result = translateCore(code, text, depth + 1);
  return result === null ? text : result;
}

function translatePattern(code, text, depth) {
  const idx = CODES.indexOf(code);
  if (idx < 0) return null;
  for (let i = 0; i < patterns.length; i += 1) {
    const p = patterns[i];
    const m = p.re.exec(text);
    if (!m || !p.values[idx]) continue;
    return p.values[idx].replace(PLACEHOLDER, (_, n) => {
      const pos = p.order.indexOf(Number(n));
      return pos < 0 ? "" : innerTranslate(code, m[pos + 1], depth);
    });
  }
  return null;
}

function translateCore(code, text, depth = 0) {
  if (code === "en") return null;
  const dict = translations[code];
  if (!dict || !text) return null;
  if (hasOwn(dict, text)) return dict[text];
  const end = code === "hi" ? "।" : ".";
  if (text.slice(-1) === ".") {
    const bare = text.slice(0, -1);
    if (hasOwn(dict, bare)) return dict[bare] + end;
  } else if (hasOwn(dict, text + ".")) {
    return dict[text + "."].replace(/[.।]$/, "");
  }
  return translatePattern(code, text, depth);
}

export const language = writable(getPreference("language") || null);
export const currentLanguage = derived(language, ($language) => $language || "en");
export const ht = derived(currentLanguage, ($code) => (id, fallback) =>
  (howTo[$code] && howTo[$code][id]) || fallback,
);
export const isLanguageSelected = derived(language, ($language) => Boolean($language));

language.subscribe((code) => {
  if (typeof document !== "undefined") document.documentElement.lang = code || "en";
});

export function translate(code, key) {
  const selected = translations[code] || translations.en;
  if (hasOwn(selected, key)) return selected[key];
  const found = translateCore(code, key);
  if (found !== null) return found;
  return hasOwn(translations.en, key) ? translations.en[key] : key;
}

export function translateMessage(message, code = get(currentLanguage)) {
  const text = String(message === undefined || message === null ? "" : message).replace(
    /^(ExcaliburFX ERROR|ExcaliburFX|Excalibur): /,
    "",
  );
  if (code === "en") return text;
  const whole = translateCore(code, text);
  if (whole !== null) return whole;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      const tr = translateCore(code, trimmed);
      return tr === null ? line : line.replace(trimmed, () => tr);
    })
    .join("\n");
}

export function setLanguage(code) {
  const valid = LANGUAGES.some((item) => item.code === code);
  if (!valid) throw new Error("Unsupported language: " + code);
  language.set(code);
  setPreference("language", code);
  if (typeof document !== "undefined") document.documentElement.lang = code;
}

export function getLanguageDictionary(code) {
  return { ...(translations[code] || translations.en) };
}

export function installDomTranslation() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => {};

  const ATTRIBUTES = ["title", "aria-label", "placeholder", "alt"];
  const SKIP_TEXT = "[data-i18n-skip], script, style, textarea";
  const textState = new WeakMap();
  const attrState = new WeakMap();
  let code = get(currentLanguage);

  const apply = (source) => {
    const trimmed = source.trim();
    if (!trimmed || code === "en") return source;
    const tr = translateCore(code, trimmed);
    return tr === null ? source : source.replace(trimmed, () => tr);
  };

  function translateTextNode(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP_TEXT)) return;
    let state = textState.get(node);
    if (!state || state.applied !== node.nodeValue) {
      state = { source: node.nodeValue, applied: node.nodeValue };
      textState.set(node, state);
    }
    const next = apply(state.source);
    if (next !== node.nodeValue) node.nodeValue = next;
    state.applied = next;
  }

  function translateElement(el) {
    if (el.closest("[data-i18n-skip]")) return;
    let states = attrState.get(el);
    if (!states) {
      states = {};
      attrState.set(el, states);
    }
    ATTRIBUTES.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const value = el.getAttribute(attr);
      let state = states[attr];
      if (!state || state.applied !== value) {
        state = { source: value, applied: value };
        states[attr] = state;
      }
      const next = apply(state.source);
      if (next !== value) el.setAttribute(attr, next);
      state.applied = next;
    });
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) return translateTextNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateElement(node);
    }
  }

  const unsubscribe = currentLanguage.subscribe((lang) => {
    code = lang;
    translateTree(document.body);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === "characterData") translateTextNode(m.target);
      else if (m.type === "attributes") translateElement(m.target);
      else m.addedNodes.forEach(translateTree);
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRIBUTES,
  });

  const nativeAlert = window.alert;
  const nativeConfirm = window.confirm;
  window.alert = (m) => nativeAlert.call(window, translateMessage(m));
  window.confirm = (m) => nativeConfirm.call(window, translateMessage(m));

  return () => {
    observer.disconnect();
    unsubscribe();
    window.alert = nativeAlert;
    window.confirm = nativeConfirm;
  };
}

export const t = derived(currentLanguage, ($currentLanguage) => (key) =>
  translate($currentLanguage, key),
);