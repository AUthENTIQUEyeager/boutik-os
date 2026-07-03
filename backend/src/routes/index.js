const express = require('express');
const router = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth');
const auth = require('../controllers/authController');
const boutique = require('../controllers/boutiqueController');
const categorie = require('../controllers/categorieController');
const vente = require('../controllers/venteController');
const client = require('../controllers/clientController');
const salarie = require('../controllers/salarieController');
const commande = require('../controllers/commandeController');
const depense = require('../controllers/depenseController');
const dette = require('../controllers/detteController');
const sync = require('../controllers/syncController');
const pwa = require('../controllers/pwaController');
const admin = require('../controllers/adminController');
const importCtrl = require('../controllers/importController');

// --- Auth ---
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authMiddleware, auth.me);
router.put('/auth/password', authMiddleware, auth.changePassword);

// --- Boutique ---
router.get('/boutique', authMiddleware, boutique.getBoutique);
router.put('/boutique', authMiddleware, boutique.updateBoutique);
router.get('/boutique/stats', authMiddleware, boutique.getStats);

// --- Catégories & produits ---
router.get('/categories', authMiddleware, categorie.list);
router.post('/categories', authMiddleware, categorie.create);
router.put('/categories/:id', authMiddleware, categorie.update);
router.delete('/categories/:id', authMiddleware, categorie.remove);
router.get('/produits', authMiddleware, categorie.listProduits);
router.get('/produits/:id', authMiddleware, categorie.getProduit);

// --- Ventes ---
router.get('/ventes', authMiddleware, vente.list);
router.post('/ventes', authMiddleware, vente.create);
router.get('/ventes/stats/boss', authMiddleware, vente.bossStats);

// --- Clients ---
router.get('/clients', authMiddleware, client.list);
router.post('/clients', authMiddleware, client.create);
router.put('/clients/:id', authMiddleware, client.update);
router.delete('/clients/:id', authMiddleware, client.remove);
router.get('/clients/:id/historique', authMiddleware, client.getHistorique);

// --- Salariés ---
router.get('/salaries', authMiddleware, salarie.list);
router.post('/salaries', authMiddleware, salarie.create);
router.put('/salaries/:id', authMiddleware, salarie.update);
router.get('/salaries/:id/performances', authMiddleware, salarie.performances);

// --- Commandes ---
router.get('/commandes', authMiddleware, commande.list);
router.post('/commandes', authMiddleware, commande.create);
router.put('/commandes/:id/statut', authMiddleware, commande.updateStatut);

// --- Dépenses ---
router.get('/depenses', authMiddleware, depense.list);
router.post('/depenses', authMiddleware, depense.create);
router.delete('/depenses/:id', authMiddleware, depense.remove);

// --- Dettes ---
router.get('/dettes', authMiddleware, dette.list);
router.post('/dettes', authMiddleware, dette.create);
router.post('/dettes/:id/paiement', authMiddleware, dette.addPaiement);

// --- Sync ---
router.post('/sync', authMiddleware, sync.push);
router.get('/sync/pull', authMiddleware, sync.pull);

// --- PWA ---
router.post('/pwa/install', pwa.trackInstall);
router.post('/pwa/visit', pwa.trackVisit);

// --- Import CSV ---
router.post('/import/produits', authMiddleware, importCtrl.importProduits);
router.post('/import/clients', authMiddleware, importCtrl.importClients);

// --- Admin ---
router.post('/admin/login', auth.adminLogin);
router.get('/admin/boutiques', authMiddleware, adminOnly, admin.listBoutiques);
router.put('/admin/boutiques/:id/bloquer', authMiddleware, adminOnly, admin.bloquer);
router.put('/admin/boutiques/:id/debloquer', authMiddleware, adminOnly, admin.debloquer);
router.get('/admin/stats', authMiddleware, adminOnly, admin.globalStats);
router.get('/admin/pwa/stats', authMiddleware, adminOnly, admin.pwaStats);

module.exports = router;
