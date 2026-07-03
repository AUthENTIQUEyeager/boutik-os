const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  try {
    const dettes = await prisma.dette.findMany({
      where: { boutiqueId: req.boutiqueId },
      orderBy: { createdAt: 'desc' },
      include: { paiements: { orderBy: { date: 'desc' } } },
    });
    res.json(dettes);
  } catch (err) {
    console.error('list dettes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { clientId, nomClient, telephone, montantTotal, description } = req.body;
    if (!nomClient || !montantTotal) {
      return res.status(400).json({ error: 'Nom client et montant requis' });
    }

    const dette = await prisma.dette.create({
      data: {
        boutiqueId: req.boutiqueId,
        clientId: clientId || null,
        nomClient,
        telephone,
        montantTotal: Number(montantTotal),
        montantPaye: 0,
        solde: Number(montantTotal),
        description,
      },
    });
    res.status(201).json(dette);
  } catch (err) {
    console.error('create dette error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.addPaiement = async (req, res) => {
  try {
    const { id } = req.params;
    const { montant } = req.body;
    if (!montant || Number(montant) <= 0) return res.status(400).json({ error: 'Montant invalide' });

    const dette = await prisma.dette.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!dette) return res.status(404).json({ error: 'Dette introuvable' });

    const nouveauPaye = dette.montantPaye + Number(montant);
    const nouveauSolde = Math.max(dette.montantTotal - nouveauPaye, 0);
    const statut = nouveauSolde === 0 ? 'paye' : 'en_cours';

    const [updated] = await prisma.$transaction([
      prisma.dette.update({
        where: { id },
        data: { montantPaye: nouveauPaye, solde: nouveauSolde, statut },
      }),
      prisma.paiementDette.create({ data: { detteId: id, montant: Number(montant) } }),
    ]);

    res.json(updated);
  } catch (err) {
    console.error('addPaiement error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
