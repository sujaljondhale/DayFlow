import { ReactNode } from 'react';
import { Link } from 'wouter';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <aside className="auth-aside">
          <div className="auth-aside-header">
            <Link href="/" className="brand-mark">DF</Link>
            <Link href="/" className="back-to-website">Back to website &rarr;</Link>
          </div>
          <div className="auth-aside-content">
            <h2>Every workday,<br />perfectly aligned.</h2>
            <div className="slider-dots">
              <span className="active" />
              <span />
              <span />
            </div>
          </div>
        </aside>
        <main className="auth-main">
          {children}
        </main>
      </div>
    </div>
  );
}
