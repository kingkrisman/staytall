import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScrollTrigger } from '../lib/gsap';
import { initSmoothScroll, lockScroll } from '../lib/scroll';
import { useStore } from '../context/StoreContext';
import { useDb } from '../context/DbContext';
import { useAuth } from '../context/AuthContext';
import { TLink } from '../context/TransitionContext';
import Preloader from '../components/Preloader';
import Cursor from '../components/Cursor';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import Manifesto from '../components/Manifesto';
import Drop from '../components/Drop';
import Reveal from '../components/Reveal';
import Shop from '../components/Shop';
import Club from '../components/Club';
import Footer from '../components/Footer';
import ProductOverlay from '../components/ProductOverlay';
import CartDrawer from '../components/CartDrawer';
import Success from '../components/Success';
import ClosedStore from '../components/ClosedStore';
import { ScrollRail } from '../components/Extras';
import { Star } from '../components/Brand';

// The preloader plays once per visit; coming back from sign-in or admin skips it.
let booted = false;

/** Shows the store, or the "closed" page when the owner has shut it (admins still get in). */
export default function StoreGate() {
  const { settings } = useDb();
  const { isAdmin } = useAuth();
  if (!settings.storeOpen && !isAdmin) return <ClosedStore />;
  return <Storefront previewClosed={!settings.storeOpen} />;
}

function Storefront({ previewClosed }) {
  const [ready, setReady] = useState(booted);
  const [order, setOrder] = useState(null);
  const { product, setCartOpen } = useStore();
  const { settings } = useDb();

  useEffect(() => initSmoothScroll(), []);

  // Keep the page still while the preloader runs.
  useEffect(() => {
    if (ready) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [ready]);

  const onLoaded = useCallback(() => {
    booted = true;
    setReady(true);
  }, []);

  const closeSuccess = useCallback(() => setOrder(null), []);

  const placed = useCallback(
    (o) => {
      setCartOpen(false);
      setTimeout(() => setOrder(o), 500);
    },
    [setCartOpen]
  );

  return (
    <div className={`store ${settings.announcement.enabled ? 'has-bar' : ''}`}>
      {!booted && <Preloader onDone={onLoaded} />}
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Nav ready={ready} />
      <ScrollRail />

      <main id="top">
        <Hero ready={ready} />
        <Marquee />
        <Manifesto />
        <Drop />
        <Reveal />
        <Shop />
        <Club />
      </main>
      <Footer />

      {previewClosed && (
        <TLink to="/admin/settings" className="preview-pill mono" data-cursor="Open">
          <Star /> Store is closed to the public — you're previewing as owner
        </TLink>
      )}

      <AnimatePresence>
        {product && <ProductOverlay key={product.product.id} product={product.product} origin={product.origin} />}
      </AnimatePresence>
      <CartDrawer onPlaced={placed} />
      <Success order={order} onClose={closeSuccess} />
    </div>
  );
}
