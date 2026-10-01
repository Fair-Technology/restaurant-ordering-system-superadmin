import { NavLink, useMatch } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  ShoppingBag,
  CreditCard,
  FileEdit,
  LogOut,
  Lock,
  ListChecks,
  Scale,
} from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-indigo-100/60 text-indigo-900 font-medium'
      : 'text-gray-500 hover:text-indigo-800 hover:bg-white/40'
  }`;

export function Sidebar() {
  const { accounts, instance } = useMsal();
  const account = accounts[0];
  const shopMatch = useMatch('/shops/:shopId/*');
  const shopId = shopMatch?.params.shopId;

  const handleSignOut = () => {
    instance.logoutRedirect();
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col glass-card rounded-none border-r border-white/30 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/30">
        <ShieldCheck className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-indigo-900 text-sm">Superadmin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          Dashboard
        </NavLink>
        <NavLink to="/shops" className={navLinkClass}>
          <Store className="w-4 h-4 flex-shrink-0" />
          Shops
        </NavLink>
        {shopId ? (
          <NavLink to={`/shops/${shopId}/orders`} className={navLinkClass}>
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            Orders
          </NavLink>
        ) : (
          <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 opacity-40 cursor-not-allowed select-none">
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            Orders
          </span>
        )}
        <NavLink to="/plans" className={navLinkClass}>
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Plans
        </NavLink>
        <NavLink to="/role-permissions" className={navLinkClass}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          Roles
        </NavLink>
        <NavLink to="/reference-lists" className={navLinkClass}>
          <ListChecks className="w-4 h-4 flex-shrink-0" />
          Food &amp; tax lists
        </NavLink>
        <NavLink to="/platform-legal" className={navLinkClass}>
          <Scale className="w-4 h-4 flex-shrink-0" />
          Legal
        </NavLink>
        <NavLink to="/name-change-requests" className={navLinkClass}>
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
