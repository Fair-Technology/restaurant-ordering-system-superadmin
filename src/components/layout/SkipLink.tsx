/**
 * SkipLink — the first Tab stop on every superadmin page. Invisible until focused; jumps
 * past the sidebar nav to the <main id="main"> landmark, so keyboard users don't have to
 * Tab through every sidebar link on each page change.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-gray-900 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Skip to content
    </a>
  );
}
