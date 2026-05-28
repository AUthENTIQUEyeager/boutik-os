/**
 * BoutiK - Données de démonstration
 * Exécuter : npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding BoutiK...')

  // Créer boutique démo
  const password = await bcrypt.hash('1234', 10)

  const boutique = await prisma.boutique.upsert({
    where: { whatsapp: '+22670000000' },
    update: {},
    create: {
      nom: 'Boutique Aminata',
      whatsapp: '+22670000000',
      password,
      adresse: 'Secteur 15, Bobo-Dioulasso'
    }
  })

  console.log(`Boutique créée : ${boutique.nom} (${boutique.whatsapp})`)

  // Catégories de démo
  const categories = [
    { nom: 'Maillots Real Madrid', prefix: 'RMA', prixAchat: 4000, prixVente: 6000, quantite: 15 },
    { nom: 'Pantalons Jeans', prefix: 'PAN', prixAchat: 5000, prixVente: 8500, quantite: 10 },
    { nom: 'Chemises Batik', prefix: 'CHE', prixAchat: 2500, prixVente: 4500, quantite: 20 },
    { nom: 'Sandales Cuir', prefix: 'SAN', prixAchat: 3000, prixVente: 5500, quantite: 8 },
  ]

  for (const cat of categories) {
    const categorieId = `${cat.prefix}-${Date.now()}`

    const categorie = await prisma.categorie.create({
      data: {
        id: categorieId,
        boutiqueId: boutique.id,
        nom: cat.nom,
        prefix: cat.prefix,
        prixAchat: cat.prixAchat,
        prixVente: cat.prixVente,
        quantite: cat.quantite
      }
    })

    // Créer les produits
    const produitsData = []
    for (let i = 1; i <= cat.quantite; i++) {
      produitsData.push({
        id: `${cat.prefix}-${String(i).padStart(4, '0')}`,
        boutiqueId: boutique.id,
        categorieId: categorie.id,
        nom: cat.nom,
        prixAchat: cat.prixAchat,
        prixVente: cat.prixVente
      })
    }
    await prisma.produit.createMany({ data: produitsData, skipDuplicates: true })
    console.log(`Catégorie créée : ${cat.nom} (${cat.quantite} produits)`)
  }

  console.log('\nSeed terminé !')
  console.log('Connexion démo :')
  console.log('  WhatsApp : +22670000000')
  console.log('  Password : 1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
