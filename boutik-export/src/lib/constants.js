/**
 * BoutiK — Constantes globales
 */

// Numéro WhatsApp du support (format international sans +, sans espaces, pour wa.me)
export const SUPPORT_WHATSAPP = '22665189025'

// Format affiché à l'utilisateur
export const SUPPORT_WHATSAPP_DISPLAY = '+226 65 18 90 25'

export function whatsappLink(message) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}
