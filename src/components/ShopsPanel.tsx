import { useEffect, useState } from 'react';
import {
  createShop,
  deleteShop,
  listShops,
  updateShop,
  type Availability,
  type CreateShopInput,
  type Shop,
} from '../shopsApi';

const EMPTY_FORM: CreateShopInput = {
  name: '',
  availability: 'standard',
  databaseType: 'standard',
  walletAddress: '',
  discordChannelName: '',
  discordServerId: '',
};

export function ShopsPanel() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setShops(await listShops());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch. State is only touched after the first await (guarded by
  // `active`) so we don't setState synchronously inside the effect body.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listShops();
        if (active) setShops(data);
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onCreated = (shop: Shop) => {
    setShops((prev) => [...prev, shop]);
    setCreating(false);
  };

  const onUpdated = (shop: Shop) => {
    setShops((prev) => prev.map((s) => (s.name === shop.name ? shop : s)));
    setEditing(null);
  };

  const onDelete = async (shop: Shop) => {
    if (!confirm(`Delete shop "${shop.displayName}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteShop(shop.name);
      setShops((prev) => prev.filter((s) => s.name !== shop.name));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="shops">
      <div className="shops-head">
        <h2>Your shops</h2>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          + New shop
        </button>
      </div>

      {error && (
        <div className="shops-error">
          <span>⚠️</span> {error}
          <button className="link" onClick={() => void load()}>
            retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading shops…</p>
      ) : shops.length === 0 ? (
        <div className="shops-empty">
          <p>You don't have any shops yet.</p>
          <p className="muted">
            Create one to deploy a shop site into the cluster.
          </p>
        </div>
      ) : (
        <div className="shops-grid">
          {shops.map((shop) => (
            <ShopCard
              key={shop.name}
              shop={shop}
              onEdit={() => setEditing(shop)}
              onDelete={() => void onDelete(shop)}
            />
          ))}
        </div>
      )}

      {creating && (
        <CreateShopModal
          onClose={() => setCreating(false)}
          onCreated={onCreated}
        />
      )}
      {editing && (
        <EditShopModal
          shop={editing}
          onClose={() => setEditing(null)}
          onUpdated={onUpdated}
        />
      )}

      <PanelStyles />
    </section>
  );
}

function ShopCard({
  shop,
  onEdit,
  onDelete,
}: {
  shop: Shop;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="shop-card">
      <div className="shop-card-head">
        <h3 title={shop.name}>{shop.displayName}</h3>
        <span className={`badge ${shop.ready ? 'ready' : 'pending'}`}>
          {shop.ready ? 'Ready' : 'Pending'}
        </span>
      </div>

      <dl className="shop-meta">
        <div>
          <dt>Availability</dt>
          <dd>
            {shop.availability} ({shop.replicas} replicas)
          </dd>
        </div>
        <div>
          <dt>Database</dt>
          <dd>{shop.databaseType === 'light' ? 'Redis' : 'PostgreSQL'}</dd>
        </div>
        <div>
          <dt>Wallet</dt>
          <dd className="mono" title={shop.walletAddress}>
            {shop.walletAddress || '—'}
          </dd>
        </div>
      </dl>

      <div className="shop-actions">
        <a
          className="btn-ghost"
          href={shop.url}
          target="_blank"
          rel="noreferrer"
        >
          Open ↗
        </a>
        <button className="btn-ghost" onClick={onEdit}>
          Configure
        </button>
        <button className="btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function CreateShopModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (shop: Shop) => void;
}) {
  const [form, setForm] = useState<CreateShopInput>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof CreateShopInput>(
    key: K,
    value: CreateShopInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onCreated(await createShop(form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New shop" onClose={onClose}>
      <form className="shop-form" onSubmit={submit}>
        <label>
          Shop name
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Healthy Food Store"
            maxLength={40}
            required
            disabled={busy}
          />
        </label>

        <div className="row">
          <label>
            Availability
            <select
              value={form.availability}
              onChange={(e) =>
                set('availability', e.target.value as Availability)
              }
              disabled={busy}
            >
              <option value="standard">standard (2 replicas)</option>
              <option value="high">high (3 replicas)</option>
            </select>
          </label>
          <label>
            Database
            <select
              value={form.databaseType}
              onChange={(e) =>
                set(
                  'databaseType',
                  e.target.value as CreateShopInput['databaseType'],
                )
              }
              disabled={busy}
            >
              <option value="standard">standard (PostgreSQL)</option>
              <option value="light">light (Redis)</option>
            </select>
          </label>
        </div>

        <label>
          Wallet address
          <input
            value={form.walletAddress}
            onChange={(e) => set('walletAddress', e.target.value)}
            placeholder="0x… — receives customer payments"
            maxLength={128}
            required
            disabled={busy}
          />
        </label>

        <div className="row">
          <label>
            Discord channel
            <input
              value={form.discordChannelName}
              onChange={(e) => set('discordChannelName', e.target.value)}
              placeholder="orders"
              required
              disabled={busy}
            />
          </label>
          <label>
            Discord server id
            <input
              value={form.discordServerId}
              onChange={(e) => set('discordServerId', e.target.value)}
              placeholder="123456789012345678"
              required
              disabled={busy}
            />
          </label>
        </div>

        {error && <div className="shops-error">⚠️ {error}</div>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create shop'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditShopModal({
  shop,
  onClose,
  onUpdated,
}: {
  shop: Shop;
  onClose: () => void;
  onUpdated: (shop: Shop) => void;
}) {
  const [name, setName] = useState(shop.displayName);
  const [availability, setAvailability] = useState<Availability>(
    shop.availability,
  );
  const [walletAddress, setWalletAddress] = useState(shop.walletAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onUpdated(
        await updateShop(shop.name, { name, availability, walletAddress }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Configure ${shop.displayName}`} onClose={onClose}>
      <form className="shop-form" onSubmit={submit}>
        <label>
          Shop name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            disabled={busy}
          />
        </label>

        <label>
          Availability
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Availability)}
            disabled={busy}
          >
            <option value="standard">standard (2 replicas)</option>
            <option value="high">high (3 replicas)</option>
          </select>
        </label>

        <label>
          Wallet address
          <input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            maxLength={128}
            required
            disabled={busy}
          />
        </label>

        <p className="muted small">
          Database tier ({shop.databaseType}) can't be changed after creation.
        </p>

        {error && <div className="shops-error">⚠️ {error}</div>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PanelStyles() {
  return (
    <style>{`
      .shops-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .shops-head h2 { margin:0; font-size:20px; color:#1a1a2e; }
      .shops-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
      .shop-card { border:1px solid #e5e7eb; border-radius:12px; padding:18px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
      .shop-card-head { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; }
      .shop-card-head h3 { margin:0; font-size:16px; color:#1a1a2e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .badge { font-size:12px; font-weight:600; padding:3px 8px; border-radius:999px; }
      .badge.ready { background:#ecfdf5; color:#059669; }
      .badge.pending { background:#fffbeb; color:#d97706; }
      .shop-meta { display:flex; flex-direction:column; gap:8px; margin:0 0 16px; }
      .shop-meta div { display:flex; justify-content:space-between; gap:12px; font-size:13px; }
      .shop-meta dt { color:#6b7280; margin:0; }
      .shop-meta dd { margin:0; color:#374151; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60%; }
      .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
      .shop-actions { display:flex; gap:8px; }
      .shop-actions > * { flex:1; text-align:center; }
      .muted { color:#9ca3af; }
      .small { font-size:12px; }
      .shops-empty { border:1px dashed #d1d5db; border-radius:12px; padding:40px; text-align:center; }
      .shops-empty p { margin:4px 0; }
      .shops-error { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; padding:10px 14px; border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:8px; font-size:14px; }

      .btn-primary { background:#4f46e5; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-weight:600; font-size:14px; cursor:pointer; }
      .btn-primary:hover:not(:disabled) { background:#4338ca; }
      .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
      .btn-ghost { background:#fff; color:#374151; border:1px solid #e5e7eb; border-radius:8px; padding:8px 12px; font-weight:600; font-size:13px; cursor:pointer; text-decoration:none; display:inline-block; }
      .btn-ghost:hover { border-color:#4f46e5; color:#4f46e5; }
      .btn-danger { background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:8px 12px; font-weight:600; font-size:13px; cursor:pointer; }
      .btn-danger:hover { background:#fef2f2; }
      .link { background:none; border:none; color:#4f46e5; cursor:pointer; font-weight:600; margin-left:auto; }

      .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; padding:20px; z-index:50; }
      .modal { background:#fff; border-radius:16px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
      .modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .modal-head h3 { margin:0; font-size:18px; color:#1a1a2e; }
      .modal-close { background:none; border:none; font-size:24px; line-height:1; color:#9ca3af; cursor:pointer; }
      .modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }

      .shop-form { display:flex; flex-direction:column; gap:14px; }
      .shop-form label { display:flex; flex-direction:column; gap:5px; font-size:13px; font-weight:500; color:#374151; }
      .shop-form .row { display:flex; gap:12px; }
      .shop-form .row label { flex:1; }
      .shop-form input, .shop-form select { padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; background:#fafafa; color:#1a1a2e; outline:none; }
      .shop-form input:focus, .shop-form select:focus { border-color:#4f46e5; background:#fff; box-shadow:0 0 0 3px rgba(79,70,229,.1); }
    `}</style>
  );
}
