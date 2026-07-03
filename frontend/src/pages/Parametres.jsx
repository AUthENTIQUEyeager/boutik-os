import { useEffect, useState, useRef } from 'react';
import {
  Save, Upload, RefreshCw, MessageCircle, LogOut, Users, Plus,
  FileUp, Lock, BarChart3, Globe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { api } from '../lib/api';
import { syncService } from '../lib/sync';
import { logout } from '../lib/auth';
import { DEVISES, waLink, WHATSAPP_SUPPORT } from '../lib/constants';
import { useApp } from '../store/AppContext';

export default function Parametres() {
  const { boutique, setBoutique, syncStatus } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: '', adresse: '', devise: 'FCFA', siteWeb: '' });
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);
  const importFileRef = useRef(null);

  const [salaries, setSalaries] = useState([]);
  const [salarieModalOpen, setSalarieModalOpen] = useState(false);
  const [salarieForm, setSalarieForm] = useState({ nom: '', poste: '', telephone: '', salaire: '' });

  const [importType, setImportType] = useState('produits');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ ancien: '', nouveau: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (boutique) {
      setForm({ nom: boutique.nom, adresse: boutique.adresse || '', devise: boutique.devise, siteWeb: boutique.siteWeb || '' });
      setLogo(boutique.logo || null);
    }
    api.getSalaries().then(setSalaries);
  }, [boutique]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.updateBoutique({ ...form, logo });
      setBoutique(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSalarie = async () => {
    if (!salarieForm.nom) return;
    await api.createSalarie(salarieForm);
    setSalaries(await api.getSalaries());
    setSalarieForm({ nom: '', poste: '', telephone: '', salaire: '' });
    setSalarieModalOpen(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const result = importType === 'produits' ? await api.importProduits(text) : await api.importClients(text);
      setImportResult(result);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.nouveau || pwForm.nouveau.length < 4) {
      setPwError('Le nouveau mot de passe doit contenir au moins 4 caractères');
      return;
    }
    setPwSaving(true);
    try {
      await api.changePassword(pwForm);
      setPwForm({ ancien: '', nouveau: '' });
      setPwOpen(false);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const csvTemplate = importType === 'produits'
    ? 'nom,prixAchat,prixVente,quantite\nRiz 25kg,15000,18000,20'
    : 'nom,telephone,email,adresse\nAli Traoré,70123456,ali@mail.com,Secteur 12';

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${importType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-950 mb-4">Paramètres</h1>

      <div className="space-y-4">
        {/* Infos boutique */}
        <Card>
          <p className="font-semibold text-slate-950 mb-3">Informations de la boutique</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-card bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-slate-500 text-xs">Logo</span>}
            </div>
            <div>
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileInputRef.current?.click()}>
                Changer le logo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
          <div className="space-y-3">
            <Input label="Nom de la boutique" value={form.nom} onChange={set('nom')} />
            <Input label="Adresse" value={form.adresse} onChange={set('adresse')} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Devise</label>
              <select value={form.devise} onChange={set('devise')} className="w-full h-10 rounded-input border border-slate-200 px-3 text-base">
                {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <Button className="mt-4" icon={Save} loading={saving} onClick={handleSave}>
            {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </Button>
        </Card>

        {/* Salariés */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-950 flex items-center gap-2"><Users size={16} /> Salariés</p>
            <Button variant="secondary" size="xs" icon={Plus} onClick={() => setSalarieModalOpen(true)}>Ajouter</Button>
          </div>
          {salaries.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun salarié enregistré</p>
          ) : (
            <div className="space-y-2">
              {salaries.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{s.nom}</p>
                    <p className="text-xs text-slate-500">{s.poste || 'Poste non précisé'} · {s._count?.ventes || 0} ventes</p>
                  </div>
                  <Badge variant={s.actif ? 'success' : 'default'}>{s.actif ? 'Actif' : 'Inactif'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Import CSV */}
        <Card>
          <p className="font-semibold text-slate-950 mb-3 flex items-center gap-2"><FileUp size={16} /> Import de données</p>
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setImportType('produits'); setImportResult(null); }} className={`px-3 py-1.5 rounded-full text-sm font-medium ${importType === 'produits' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>Produits</button>
            <button onClick={() => { setImportType('clients'); setImportResult(null); }} className={`px-3 py-1.5 rounded-full text-sm font-medium ${importType === 'clients' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>Clients</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>Télécharger le modèle CSV</Button>
            <input ref={importFileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="brand_outline" size="sm" icon={Upload} loading={importing} onClick={() => importFileRef.current?.click()}>
              Importer un CSV
            </Button>
          </div>
          {importResult && (
            <div className="mt-3 text-sm">
              {importResult.error ? (
                <p className="text-danger">{importResult.error}</p>
              ) : (
                <>
                  <p className="text-brand font-medium">{importResult.created} élément(s) importé(s)</p>
                  {importResult.failed?.length > 0 && (
                    <p className="text-danger mt-1">{importResult.failed.length} ligne(s) en erreur</p>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        {/* Sync & statut */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-950">Synchronisation</p>
              <p className="text-sm text-slate-500 capitalize">{syncStatus === 'offline' ? 'Hors ligne' : syncStatus === 'syncing' ? 'Synchronisation en cours' : syncStatus === 'error' ? 'Erreur de synchronisation' : 'À jour'}</p>
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => syncService.syncNow()}>Synchroniser</Button>
          </div>
        </Card>

        {/* Statistiques avancées */}
        <Card onClick={() => navigate('/stats')} className="flex items-center justify-between">
          <p className="font-medium text-slate-950 flex items-center gap-2"><BarChart3 size={16} /> Voir les statistiques avancées</p>
        </Card>

        {/* Site web */}
        <Card>
          <p className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><Globe size={16} /> Site web</p>
          {form.siteWeb ? (
            <a href={form.siteWeb} target="_blank" rel="noreferrer" className="text-sm text-brand underline">{form.siteWeb}</a>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-3">Vous n'avez pas encore de site web pour votre boutique.</p>
              <a href={waLink(WHATSAPP_SUPPORT, "Bonjour, je souhaite un site web pour ma boutique BoutiK.")} target="_blank" rel="noreferrer">
                <Button variant="brand_outline" size="sm" icon={MessageCircle}>Demander un site web</Button>
              </a>
            </>
          )}
        </Card>

        {/* Sécurité */}
        <Card onClick={() => setPwOpen(true)} className="flex items-center justify-between">
          <p className="font-medium text-slate-950 flex items-center gap-2"><Lock size={16} /> Changer le mot de passe</p>
        </Card>

        <Button variant="danger" className="w-full" icon={LogOut} onClick={logout}>Se déconnecter</Button>
      </div>

      {/* Modale ajout salarié */}
      <Modal open={salarieModalOpen} onClose={() => setSalarieModalOpen(false)} title="Nouveau salarié">
        <div className="space-y-3">
          <Input label="Nom" value={salarieForm.nom} onChange={(e) => setSalarieForm((f) => ({ ...f, nom: e.target.value }))} required />
          <Input label="Poste" value={salarieForm.poste} onChange={(e) => setSalarieForm((f) => ({ ...f, poste: e.target.value }))} placeholder="Ex: Vendeur" />
          <Input label="Téléphone" value={salarieForm.telephone} onChange={(e) => setSalarieForm((f) => ({ ...f, telephone: e.target.value }))} />
          <Input label="Salaire" type="number" value={salarieForm.salaire} onChange={(e) => setSalarieForm((f) => ({ ...f, salaire: e.target.value }))} placeholder="0" />
          <Button className="w-full" onClick={handleAddSalarie}>Ajouter</Button>
        </div>
      </Modal>

      {/* Modale changement mot de passe */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Changer le mot de passe">
        <div className="space-y-3">
          <Input label="Ancien mot de passe" type="password" value={pwForm.ancien} onChange={(e) => setPwForm((f) => ({ ...f, ancien: e.target.value }))} />
          <Input label="Nouveau mot de passe" type="password" value={pwForm.nouveau} onChange={(e) => setPwForm((f) => ({ ...f, nouveau: e.target.value }))} />
          {pwError && <p className="text-sm text-danger">{pwError}</p>}
          <Button className="w-full" loading={pwSaving} onClick={handleChangePassword}>Confirmer</Button>
        </div>
      </Modal>
    </div>
  );
}
