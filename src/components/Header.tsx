import { navLinks } from '../data';

interface Props {
  active: number;
  wide: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
}

export function Header({ active, wide, soundOn, onToggleSound }: Props) {
  return (
    <div className="header-wrap">
      <div className="header-fade" />
      <header className="header">
        <a href="#top" className="header-name">سعد الرفاعي</a>
        {wide && (
          <nav className="header-nav">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className={`nav-link${l.scenes.includes(active) ? ' is-active' : ''}`}>
                {l.label}
              </a>
            ))}
          </nav>
        )}
        <div className="header-actions">
          <button type="button" className="sound-btn" onClick={onToggleSound}>
            {soundOn ? 'إيقاف الصوت' : 'تشغيل الصوت'}
          </button>
          <a href="#contact" className="btn btn-sm">تواصل معي</a>
        </div>
      </header>
    </div>
  );
}
