/**
 * BoutiK — Pull descendant (backend → IndexedDB)
 * Récupère toutes les données du serveur et les écrit localement
 */
import { getDB } from './db'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function pullFromBackend(token) {
  if (!API_URL || !navigator.onLine) return { success: false, reason: 'offline' }

  try {
    const res = await fetch(`${API_URL}/api/sync/pull`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) return { success: false, reason: `HTTP ${res.status}` }

    const { boutique, categories, produits, ventes } = await res.json()
    const db = await getDB()

    // Écrire tout dans IndexedDB (upsert — ne supprime rien)
    const tx = db.transaction(
      ['boutiques', 'categories', 'produits', 'ventes'],
      'readwrite'
    )

    // Boutique
    if (boutique) {
      const existing = await tx.objectStore('boutiques').get(boutique.id)
      await tx.objectStore('boutiques').put({
        ...boutique,
        motDePasse: existing?.motDePasse || '',
        synced: true
      })
    }

    // Catégories
    for (const cat of categories || []) {
      await tx.objectStore('categories').put({ ...cat, synced: true })
    }

    // Produits
    for (const prod of produits || []) {
      await tx.objectStore('produits').put({ ...prod, synced: true })
    }

    // Ventes
    for (const vente of ventes || []) {
      await tx.objectStore('ventes').put({ ...vente, synced: true })
    }

    await tx.done

    return {
      success: true,
      counts: {
        categories: categories?.length || 0,
        produits: produits?.length || 0,
        ventes: ventes?.length || 0
      }
    }
  } catch (err) {
    console.error('Pull error:', err)
    return { success: false, reason: err.message }
  }
}
