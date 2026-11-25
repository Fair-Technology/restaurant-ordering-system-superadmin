import { useEffect, useRef, useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  Users,
  ShoppingBag,
  CreditCard,
  FileEdit,
  LogOut,
  Lock,
  ListChecks,
  Scale,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-react';

/** Tailwind `md` breakpoint. Keep in sync with the `md:` classes below. */
const DESKTOP_QUERY = '(min-width: 768px)';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-indigo-100/60 text-indigo-900 font-medium'
      : 'text-gray-500 hover:text-indigo-800 hover:bg-white/40'
  }`;

type SidebarProps = {
  /** Drawer state below the `md` breakpoint. Ignored from `md` up, where the sidebar is always shown. */
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { accounts, instance } = useMsal();
  const account = accounts[0];
  const shopMatch = useMatch('/shops/:shopId/*');
  const shopId = shopMatch?.params.shopId;

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(DESKTOP_QUERY).matches,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Move focus into the drawer when it opens.
  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  // Below md a closed drawer is only translated off-screen; `inert` removes it from the
  // tab order and accessibility tree. It must never apply from md up, where it is always shown.
  const closedOnMobile = !isDesktop && !open;

  const handleSignOut = () => {
    instance.logoutRedirect();
  };

  return (
    <aside
      {...(closedOnMobile ? { inert: true } : {})}
      aria-hidden={closedOnMobile ? true : undefined}
      className={`w-56 flex-shrink-0 flex flex-col glass-card rounded-none border-r border-white/30 min-h-screen
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 overflow-y-auto
        md:static md:z-auto md:translate-x-0 md:sticky md:top-0 md:overflow-visible
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/30">
        <ShieldCheck className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-indigo-900 text-sm">Superadmin</span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="ml-auto md:hidden p-1 rounded text-gray-500 hover:text-indigo-800 hover:bg-white/40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClass} onClick={onClose}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          Dashboard
        </NavLink>
        <NavLink to="/shops" className={navLinkClass} onClick={onClose}>
          <Store className="w-4 h-4 flex-shrink-0" />
          Shops
        </NavLink>
        <NavLink to="/owners" className={navLinkClass} onClick={onClose}>
          <Users className="w-4 h-4 flex-shrink-0" />
          Owners
        </NavLink>
        {shopId ? (
          <NavLink to={`/shops/${shopId}/orders`} className={navLinkClass} onClick={onClose}>
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            Orders
          </NavLink>
        ) : (
          <span
            role="link"
            aria-disabled="true"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 opacity-40 cursor-not-allowed select-none"
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Orders
            <span className="sr-only">(unavailable — open a shop first)</span>
          </span>
        )}
        <NavLink to="/rejection-watch" className={navLinkClass} onClick={onClose}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Decline watch
        </NavLink>
        <NavLink to="/plans" className={navLinkClass} onClick={onClose}>
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Plans
        </NavLink>
        <NavLink to="/role-permissions" className={navLinkClass} onClick={onClose}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          Roles
        </NavLink>
        <NavLink to="/reference-lists" className={navLinkClass} onClick={onClose}>
          <ListChecks className="w-4 h-4 flex-shrink-0" />
          Food &amp; tax lists
        </NavLink>
        <NavLink to="/content-reports" className={navLinkClass} onClick={onClose}>
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          Content reports
        </NavLink>
        <NavLink to="/platform-legal" className={navLinkClass} onClick={onClose}>
          <Scale className="w-4 h-4 flex-shrink-0" />
          Legal
        </NavLink>
        <NavLink to="/name-change-requests" className={navLinkClass} onClick={onClose}>
          <FileEdit className="w-4 h-4 flex-shrink-0" />
          Name Changes
        </NavLink>
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-white/30">
        {account && (
          <p className="text-xs text-gray-500 mb-3 truncate">{account.username}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
