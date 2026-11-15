import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-1 min-h-[55vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
        <Compass className="h-7 w-7 text-indigo-600" />
      </div>
      <h1 className="text-xl font-semibold text-indigo-950">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">The page you were looking for doesn't exist or has moved.</p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
