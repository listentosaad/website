import type { ReactNode } from 'react';
import {
  CONTACT, featuredSolo, isLive, partnerProducts, roles, soloProducts, teamProducts, teamStats, type Product,
} from '../data';

/** Card shell: a link when the product has a URL, a plain block otherwise. */
function CardShell({ product, className, children }: { product: Product; className: string; children: ReactNode }) {
  return product.href
    ? <a href={product.href} className={`${className} is-link`}>{children}</a>
    : <div className={className}>{children}</div>;
}

function Status({ product, className }: { product: Product; className: string }) {
  return <span className={`${className}${isLive(product) ? ' is-live' : ''}`}>{product.status}</span>;
}

function Title({ product, className }: { product: Product; className: string }) {
  return product.ltr
    ? <span dir="ltr" className={`${className} ltr-right`}>{product.title}</span>
    : <span className={className}>{product.title}</span>;
}

function SocialLinks() {
  return (
    <>
      <a href={CONTACT.linkedin} rel="me">LinkedIn</a>
      <a href={CONTACT.x} rel="me">X</a>
      <a href={CONTACT.github} rel="me">GitHub</a>
    </>
  );
}

export function Hero() {
  return (
    <section data-scene="0" className="section hero">
      <div data-reveal="1" className="container hero-inner">
        <h1 className="hero-title">سعد الرفاعي</h1>
        <p className="hero-lead">مدير منتجات وشريك مؤسس في نقوة. أحوّل الأفكار إلى منتجات تحقق إيرادات.</p>
        <div className="link-row">
          <a href={CONTACT.email} className="btn btn-lg">راسلني</a>
          <SocialLinks />
          <span className="muted">جدة، السعودية</span>
        </div>
      </div>
    </section>
  );
}

export function PartnerProducts() {
  return (
    <section id="products" data-scene="1" className="section">
      <div data-reveal="1" className="container partners">
        <div className="partners-intro">
          <h2 className="h2">منتجات مع شركاء</h2>
          <p className="body">شاركت في تأسيس نقوة وأدير منتجاتها. نساعد المستثمرين على استثمار متوافق مع الشريعة.</p>
          <p className="body-sm muted">بتحليل سلوك المستخدمين، رفعنا مبالغ التطهير لتصل إلى مليون ريال خلال 9 أسابيع<br /></p>
        </div>
        <div className="stack">
          {partnerProducts.map(p => (
            <CardShell key={p.title} product={p} className="card">
              <Status product={p} className="card-status" />
              <Title product={p} className="card-title" />
              <span className="card-desc">{p.description}</span>
            </CardShell>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamProducts() {
  return (
    <section data-scene="2" className="section section-tall">
      <div data-reveal="1" className="container column">
        <div className="team-head">
          <div className="team-intro">
            <h2 className="h2">منتجات مع فريقي</h2>
            <p className="body">أدير المنتجات الرقمية والفريق التقني في مجمع وادي جدة للابتكار. نبني لرواد الأعمال والقطاع.</p>
          </div>
          <div className="stats">
            {teamStats.map(s => (
              <div key={s.label} className="stat">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rows">
          {teamProducts.map(p => (
            <CardShell key={p.title} product={p} className="row">
              <div className="row-head">
                <Status product={p} className="row-status" />
                <span className="row-title">{p.title}</span>
              </div>
              <span className="row-desc">{p.description}</span>
            </CardShell>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SoloProducts() {
  return (
    <section data-scene="3" className="section">
      <div data-reveal="1" className="container column">
        <h2 className="h2">منتجات بنيتها وحدي</h2>
        <div className="solo-grid">
          <a href={featuredSolo.href} className="feature">
            <span className="feature-status">{featuredSolo.status}</span>
            <div className="feature-body">
              <span className="feature-title">{featuredSolo.title}</span>
              <span className="feature-desc">{featuredSolo.description}</span>
            </div>
          </a>
          {soloProducts.map(p => (
            <div key={p.title} className="card card-round">
              <span className="card-status">{p.status}</span>
              <Title product={p} className="card-title" />
              <span className="card-desc">{p.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Organisations() {
  return (
    <section id="orgs" data-scene="4" className="section">
      <div data-reveal="1" className="container orgs">
        <h2 className="h2">مسيرتي</h2>
        <div className="roles">
          {roles.map(r => (
            <div key={`${r.title}-${r.org}`} className="role">
              <span className={`role-period${r.current ? ' is-live' : ''}`}>{r.period}</span>
              <span className="role-title">{r.title}</span>
              <span className="role-org">{r.org}</span>
              {r.description && <span className="role-desc">{r.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" data-scene="5" className="section contact">
      <div data-reveal="1" className="container column contact-inner">
        <h2 className="h2 balance">لديك فكرة؟ لنطلقها.</h2>
        <p className="contact-lead">يسعدني الحديث عن المنتجات والذكاء الاصطناعي وبناء ما يعمل.</p>
        <div className="link-row">
          <a href={CONTACT.email} className="btn btn-xl">راسلني</a>
          <SocialLinks />
        </div>
      </div>
      <div className="container footer">
        <span className="footer-name">سعد الرفاعي</span>
        <span className="footer-note">© 2026، كل الحقوق محفوظة عند اللي يحفظون الحقوق&nbsp;</span>
      </div>
    </section>
  );
}
