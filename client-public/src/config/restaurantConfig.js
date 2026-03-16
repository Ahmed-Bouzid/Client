// restaurantConfig.js
// En production : le restaurantId vient du QR code (URL param /r/[restaurantId]).
// Cette valeur est null par défaut — elle sera écrasée dynamiquement au scan du QR.
// ⚠️ Ne jamais hardcoder un ID ici en production.

export const Resto_id_key = process.env.EXPO_PUBLIC_DEFAULT_RESTAURANT_ID || null;

// IDs connus (référence pour le développement uniquement) :
// 6983310d35c06895f98d7549  →  MabCafé
// 6970ef6594abf8bacd9d804d  →  Lacucinadinini
// 695e4300adde654b80f6911a  →  Le Grillz ⚡ AVEC COMMANDES EXPRESS
// 686af511bb4cba684ff3b72e  →  Chez Ahmed
// 69a035934b395eaaba6b8d21  →  laBoucle
