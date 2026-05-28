/**
 * BoutiK - Utilitaires
 */

export const formatCFA = (n) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F'

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })

export const formatDateRelative = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  return formatDate(iso)
}

export const isToday = (iso) =>
  new Date(iso).toDateString() === new Date().toDateString()

export const isThisWeek = (iso) =>
  (new Date() - new Date(iso)) <= 7 * 24 * 60 * 60 * 1000
