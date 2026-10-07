import { Suspense, useEffect, useState } from 'react';
import { Navigate, NavLink, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { TLink, useGo } from '../../context/TransitionContext';
import { initials } from '../../lib/db';
import { Button, EASE, Icon } from '../../components/admin/ui';
import { Mark } from '../../components/Brand';

const NAV = [
  { to: '/admin', label: 'Overview', icon: 'grid', end: true, key: 'dashboard' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt', key: 'orders' },
  { to: '/admin/products', label: 'Products', icon: 'shirt', key: 'products' },
  { to: '/admin/customers', label: 'Customers', icon: 'users', key: 'customers' },
  { to: '/admin/discounts', label: 'Discounts', icon: 'tag', key: 'discounts' },
  { to: '/admin/storefront', label: 'Storefront', icon: 'layout', key: 'storefront' },
  { to: '/admin/settings', label: 'Settings', icon: 'sliders', key: 'settings' },
];

function Denied() {
  const { user, signOut } = useAuth();
  const go = useGo();
  return (
    <div className="adm-denied">
      <Mark className="adm-denied__mark" />
      <h1>Owners only.</h1>
      <p>You're signed in as <b>{user.email}</b>, which is a customer account. The admin console is for the store owner.</p>
      <div>
        <Button icon="logout" onClick={() => { signOut(); go('/signin?next=/admin'); }}>Switch account</Button>
        <Button variant="ghost" onClick={() => go('/')}>Back to store</Button>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="adm-loading" aria-label="Loading">
      <Mark />
    </div>
  );
}

export default function AdminLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const { db, settings, updateSettings } = useDb();
  const { showToast } = useStore();
  const location = useLocation();
  const outlet = useOutlet();
  const go = useGo();
  const [navOpen, setNavOpen] = useState(false);

  // Warm the other admin pages so section switches never wait on the network.
  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => {
      import('./Dashboard'); import('./Orders'); import('./Products'); import('./ProductEditor');
      import('./Customers'); import('./Discounts'); import('./StorefrontSettings'); import('./Settings');
    }, 400);
    return () => clearTimeout(t);
  }, [isAdmin]);

  useEffect(() => setNavOpen(false), [location.pathname]);

  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Denied />;

  const section = location.pathname.split('/')[2] || 'dashboard';
  const sectionKey = section === 'products' && location.pathname.split('/')[3] ? 'product-editor' : section;
  const badges = {
    orders: db.orders.filter((o) => o.status === 'paid').length,
  };

  const toggleStore = () => {
    updateSettings({ storeOpen: !settings.storeOpen });
    showToast(settings.storeOpen ? 'Store closed — visitors now see the countdown page' : 'Store is open — welcome back');
  };

  return (
    <div className="adm">
      <AnimatePresence>
        {navOpen && <motion.div className="adm__scrim" onClick={() => setNavOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>

      <aside className={`adm__side ${navOpen ? 'is-open' : ''}`}>
        <TLink to="/" className="adm__brand" aria-label="View store">
          <img src="/logo.png" alt="Stay Tall" width="968" height="441" />
        </TLink>
        <span className="adm__tag mono">Owner console</span>

        <nav className="adm__nav" aria-label="Admin">
          {NAV.map((item, i) => (
            <motion.div key={item.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => `adm__link ${isActive ? 'is-active' : ''}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="adm-nav" className="adm__link-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {badges[item.key] > 0 && <em className="adm__badge">{badges[item.key]}</em>}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="adm__side-foot">
          <TLink to="/" className="adm__viewstore">
            <Icon name="store" /> <span>View storefront</span> <Icon name="external" size={14} />
          </TLink>
          <div className="adm__me">
            <span className="adm__avatar">{initials(user.name)}</span>
            <div>
              <b>{user.name}</b>
              <span>{user.email}</span>
            </div>
            <button className="iconbtn" onClick={() => { signOut(); go('/'); }} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <div className="adm__main">
        <header className="adm__top">
          <button className="iconbtn adm__burger" onClick={() => setNavOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="adm__crumb mono">
            <span>Admin</span>
            <Icon name="chevron" size={12} />
            <AnimatePresence mode="wait">
              <motion.b key={section} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.3 }}>
                {NAV.find((n) => n.key === section)?.label || section}
              </motion.b>
            </AnimatePresence>
          </div>
          <div className="adm__top-right">
            <button className={`storeswitch ${settings.storeOpen ? 'is-open' : ''}`} onClick={toggleStore} title="Open or close the store to the public">
              <span className="storeswitch__dot" />
              <span>{settings.storeOpen ? 'Store open' : 'Store closed'}</span>
            </button>
            <Button as={TLink} to="/" variant="ghost" size="sm" iconRight="external">View store</Button>
          </div>
        </header>

        <main className="adm__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={sectionKey}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
