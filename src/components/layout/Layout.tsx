import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);

  // Escape closes the mobile drawer, matching the rest of the app's modal behaviour.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Backdrop only exists while the drawer is open below md. */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        {/* Mobile-only bar: the sidebar is a drawer below md. */}
        <div className="md:hidden flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            className="p-2 rounded-lg glass-card text-gray-600 hover:text-indigo-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
