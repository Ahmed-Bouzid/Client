// restaurantConfig.js
// En production : le restaurantId vient du QR code (URL param /r/[restaurantId]).
// Cette valeur est null par défaut — elle sera écrasée dynamiquement au scan du QR.
// ⚠️ Ne jamais hardcoder un ID ici en production.

export const Resto_id_key = process.env.EXPO_PUBLIC_DEFAULT_RESTAURANT_ID || "695e4300adde654b80f6911a";

// IDs connus (référence pour le développement local uniquement — ne pas commiter en prod) :
// MabCafé / Lacucinadinini / Le Grillz / Chez Ahmed / laBoucle
