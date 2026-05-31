import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AmbientScene from './AmbientScene';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';

export default function MainLayout() {
  const [showAmbientScene, setShowAmbientScene] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 992) {
      return undefined;
    }

    const start = () => setShowAmbientScene(true);

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(start, 500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="tf-public-shell">
      {showAmbientScene ? <AmbientScene /> : null}
      <Navbar />
      <main className="tf-public-main py-4 py-lg-5">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
