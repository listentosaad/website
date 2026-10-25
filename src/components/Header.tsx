import { useEffect, useState } from 'react';
import { navLinks } from '../data';

interface Props {
  active: number;
  wide: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
}

export function Header({ active, wide, soundOn, onToggleSound }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevWide, setPrevWide] = useState(wide);
  // The menu only exists on narrow screens, so crossing the breakpoint closes it.
  if (wide !== prevWide) {
    setPrevWide(wide);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const links = navLinks.map(l => (
    <a
      key={l.href}
      href={l.href}
      className={`nav-link${l.scenes.includes(active) ? ' is-active' : ''}`}
      onClick={() => setMenuOpen(false)}
    >
      {l.label}
    </a>
  ));
  const soundBtn = (
    <button type="button" className="sound-btn" onClick={onToggleSound}>
      {soundOn ? 'إيقاف الصوت' : 'تشغيل الصوت'}
    </button>
  );

  return (
    <div className="header-wrap">
      <div className="header-fade" />
      <header className="header">
        <a href="#top" className="header-name">سعد الرفاعي</a>
        {wide && <nav className="header-nav">{links}</nav>}
        <div className="header-actions">
          {wide && soundBtn}
          <a href="#contact" className="btn btn-sm">تواصل معي</a>
          {!wide && (
            <button
              type="button"
              className="menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              onClick={() => setMenuOpen(o => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                {menuOpen
                  ? <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  : <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
              </svg>
            </button>
          )}
        </div>
        {!wide && menuOpen && (
          <nav id="mobile-menu" className="mobile-menu">
            {links}
            {soundBtn}
          </nav>
        )}
      </header>
    </div>
  );
}
