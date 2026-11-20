import { usePageTitle } from '../features/layout/usePageTitle';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { NotFoundPage } from './NotFoundPage';

export function RouteErrorPage() {
  usePageTitle('Error');
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen flex flex-col">
        <NotFoundPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <h1 className="text-xl font-semibold text-indigo-950">Something went wrong</h1>
      <p className="max-w-sm text-sm text-gray-500">The page could not be loaded. Try again, or head back to the dashboard.</p>
      <button
        type="button"
        onClick={() => window.location.assign('/')}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Back to dashboard
      </button>
    </div>
  );
}
