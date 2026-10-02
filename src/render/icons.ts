import { fileURLToPath } from "node:url";
import { C } from "./theme.js";

// Icons are pre-rendered to PNG by `npm run icons` (scripts/build-icons.ts)
// and committed, so the renderer never loads React or sharp.
// To add an icon: add its react-icons/fa name here, run `npm run icons`, commit the PNG.
export const ICONS = [
  // ukratko
  "FaCalendarAlt",
  "FaBed",
  "FaUsers",
  // prijevoz (one per VrstaPrijevoza)
  "FaBus",
  "FaShip",
  "FaPlane",
  "FaTrain",
  // o agenciji
  "FaIdBadge",
  "FaShieldAlt",
  "FaCertificate",
  // cijena
  "FaCheck",
  // placanje, pogodnosti
  "FaCreditCard",
  "FaGift",
  // hvala
  "FaUser",
  "FaPhone",
  "FaEnvelope",
  "FaGlobe",
  "FaMapMarkerAlt",
] as const;

export type IconName = (typeof ICONS)[number];

export const ICON_COLOR = C.red;
export const ICON_PX = 256;

export const ICONS_DIR = fileURLToPath(new URL("../../assets/icons/", import.meta.url));

export const iconFile = (name: IconName): string => `${name}-${ICON_COLOR}.png`;

export const iconPath = (name: IconName): string => ICONS_DIR + iconFile(name);
