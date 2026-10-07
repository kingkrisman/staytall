import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { DEMO_ACCOUNTS } from '../lib/db';
import { passwordStrength, useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { TLink, useGo } from '../context/TransitionContext';
import Starfield from '../components/Starfield';
import { Mark, Star } from '../components/Brand';

const EASE = [0.16, 1, 0.3, 1];
const PERKS = ['Members get every drop 24 hours early.', 'Track each order from studio to doorstep.', 'Your sizes and address, remembered.', 'Private restocks. No queues.'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Eye({ open }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      <motion.path d="M4 4l16 16" initial={false} animate={{ pathLength: open ? 0 : 1, opacity: open ? 0 : 1 }} transition={{ duration: 0.3 }} />
    </svg>
  );
}

function Field({ id, label, error, right, ...input }) {
  return (
    <div className={`afield ${input.value ? 'is-filled' : ''} ${error ? 'is-error' : ''}`}>
      <div className="afield__box">
        <input id={id} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...input} />
        <label htmlFor={id}>{label}</label>
        <i className="afield__line" />
        {right}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-err`} className="afield__err" role="alert" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage({ mode }) {
  const isUp = mode === 'signup';
  const { user, signIn, signUp, signOut } = useAuth();
  const { showToast } = useStore();
  const go = useGo();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const query = next ? `?next=${encodeURIComponent(next)}` : '';

  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const [perk, setPerk] = useState(0);
  const formRef = useRef(null);
  const typing = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setPerk((p) => (p + 1) % PERKS.length), 2800);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => (typing.current = -1), []);
  useEffect(() => setErr(null), [mode]);

  const destFor = (u) => (next && next.startsWith('/') ? next : u.role === 'admin' ? '/admin' : '/account');
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); if (err?.field === k) setErr(null); };
  const switchTo = (m) => navigate(`/${m}${query}`, { replace: true });

  const submit = async (e) => {
    e?.preventDefault();
    if (busy || done) return;
    setBusy(true);
    setErr(null);
    const r = isUp ? await signUp(f) : await signIn(f.email, f.password);
    setBusy(false);
    if (!r.ok) {
      setErr(r);
      gsap.fromTo(formRef.current, { x: -16 }, { x: 0, duration: 0.7, ease: 'elastic.out(1.4, 0.25)' });
      return;
    }
    setDone(true);
    showToast(isUp ? `Welcome to the club, ${r.user.name.split(' ')[0]}` : `Welcome back, ${r.user.name.split(' ')[0]}`);
    setTimeout(() => go(destFor(r.user)), 650);
  };

  // Demo accounts type themselves into the form.
  const fillDemo = async (acct) => {
    const run = ++typing.current;
    if (isUp) switchTo('signin');
    setErr(null);
    setF({ name: '', email: '', password: '' });
    await sleep(isUp ? 350 : 60);
    for (let i = 1; i <= acct.email.length; i++) {
      if (typing.current !== run) return;
      setF((x) => ({ ...x, email: acct.email.slice(0, i) }));
      await sleep(16);
    }
    for (let i = 1; i <= acct.password.length; i++) {
      if (typing.current !== run) return;
      setF((x) => ({ ...x, password: acct.password.slice(0, i) }));
      await sleep(22);
    }
  };

  const strength = passwordStrength(f.password);

  return (
    <div className="auth">
      <aside className="auth__brand">
        <Starfield className="auth__stars" density={0.7} />
        <TLink to="/" className="auth__back mono">← Back to the store</TLink>
        <div className="auth__brand-inner">
          <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.3, ease: EASE }}>
            <Mark className="auth__mark" />
          </motion.div>
          <h1 className="auth__big" aria-label="Stay tall">
            {['STAY', 'TALL'].map((w, wi) => (
              <span className={`auth__line ${wi ? 'is-outline' : ''}`} key={w}>
                {w.split('').map((c, i) => (
                  <span className="ch" key={i}>
                    <motion.span className="ch__in" initial={{ y: '110%', rotate: 8 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: 0.25 + (wi * 4 + i) * 0.05, duration: 1.1, ease: EASE }}>
                      {c}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <div className="auth__perk">
            <Star />
            <AnimatePresence mode="wait">
              <motion.p key={perk} initial={{ y: 20, opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -20, opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.5, ease: EASE }}>
                {PERKS[perk]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="auth__orbit" aria-hidden="true" />
      </aside>

      <main className="auth__panel">
        <TLink to="/" className="auth__logo" aria-label="Stay Tall home">
          <img src="/logo.png" alt="Stay Tall" width="968" height="441" />
        </TLink>

        <div className="auth__card">
          {user && !done ? (
            <motion.div className="auth__signed" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
              <span className="mono">Already signed in</span>
              <h2>Hey {user.name.split(' ')[0]}.</h2>
              <p>You're signed in as <b>{user.email}</b>{user.role === 'admin' ? ' (store owner)' : ''}.</p>
              <div className="auth__signed-actions">
                <button className="abtn" onClick={() => go(destFor(user))}>Continue <span aria-hidden="true">→</span></button>
                <button className="abtn abtn--ghost" onClick={signOut}>Sign out</button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="auth__tabs" role="tablist" aria-label="Sign in or create an account">
                {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
                  <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => switchTo(m)}>
                    {mode === m && <motion.span layoutId="auth-tab" className="auth__tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  ref={formRef}
                  className="auth__form"
                  onSubmit={submit}
                  noValidate
                  initial={{ opacity: 0, x: isUp ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isUp ? -40 : 40 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <h2 className="auth__title">{isUp ? 'Join the club' : 'Welcome back'}</h2>
                  <p className="auth__sub">{isUp ? 'Create an account to get early access and track your orders.' : 'Sign in to your Stay Tall account.'}</p>

                  {isUp && (
                    <Field id="name" label="Full name" type="text" autoComplete="name" value={f.name} onChange={set('name')} error={err?.field === 'name' && err.error} />
                  )}
                  <Field id="email" label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={err?.field === 'email' && err.error} />
                  <Field
                    id="password"
                    label="Password"
                    type={show ? 'text' : 'password'}
                    autoComplete={isUp ? 'new-password' : 'current-password'}
                    value={f.password}
                    onChange={set('password')}
                    error={err?.field === 'password' && err.error}
                    right={
                      <button type="button" className="afield__eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                        <Eye open={show} />
                      </button>
                    }
                  />

                  {isUp ? (
                    <div className="meter" aria-live="polite">
                      <div className="meter__bars">
                        {[0, 1, 2, 3].map((i) => (
                          <i key={i}><motion.b initial={false} animate={{ scaleX: strength.score > i ? 1 : 0 }} transition={{ duration: 0.4, ease: EASE }} /></i>
                        ))}
                      </div>
                      <span className="mono">{f.password ? strength.label : '8+ characters'}</span>
                    </div>
                  ) : (
                    <div className="auth__row">
                      <button type="button" className="auth__link mono" onClick={() => showToast('Demo mode — no emails are sent. Try a demo account below.')}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button type="submit" className={`abtn abtn--xl ${busy ? 'is-busy' : ''} ${done ? 'is-done' : ''}`} disabled={busy}>
                    <AnimatePresence mode="wait" initial={false}>
                      {done ? (
                        <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="abtn__icon">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
                          </svg>
                        </motion.span>
                      ) : busy ? (
                        <motion.span key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="abtn__icon">
                          <Star className="abtn__spin" />
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                          {isUp ? 'Create account' : 'Sign in'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <p className="auth__swap">
                    {isUp ? 'Already a member?' : 'New here?'}{' '}
                    <button type="button" onClick={() => switchTo(isUp ? 'signin' : 'signup')}>{isUp ? 'Sign in' : 'Create an account'}</button>
                  </p>
                </motion.form>
              </AnimatePresence>

              <div className="demo">
                <div className="demo__head mono"><Star /> Demo accounts</div>
                <div className="demo__row">
                  {Object.entries(DEMO_ACCOUNTS).map(([k, a]) => (
                    <button key={k} type="button" className="demo__chip" onClick={() => fillDemo(a)}>
                      <b>{a.label}</b>
                      <span className="mono">{a.email}</span>
                    </button>
                  ))}
                </div>
                <p className="demo__note">Demo mode: accounts and orders live only in this browser. Passwords are hashed, but this isn't real security.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
