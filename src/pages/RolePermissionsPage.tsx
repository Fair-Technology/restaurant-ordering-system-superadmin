import { useEffect, useState } from 'react';
import { useGetRolePermissionsQuery, useUpdateRolePermissionsMutation } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const PERMISSION_ROWS: Array<{ key: string; label: string }> = [
  { key: 'view_orders', label: 'View orders' },
  { key: 'refund_orders', label: 'Refund orders' },
  { key: 'manage_menu', label: 'Edit menu and prices' },
  { key: 'manage_shop', label: 'Restaurant settings' },
  { key: 'manage_staff', label: 'Manage staff logins' },
  { key: 'manage_billing', label: 'Billing and payments' },
  { key: 'view_audit', label: 'View activity log' },
];

export function RolePermissionsPage() {
  const { data, isLoading, isError } = useGetRolePermissionsQuery();
  const [updateRolePermissions, { isLoading: isSaving }] = useUpdateRolePermissionsMutation();

  const [manager, setManager] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setManager(data.manager);
      setStaff(data.staff);
    }
  }, [data]);

  function toggle(role: 'manager' | 'staff', key: string) {
    setSaved(false);
    const setter = role === 'manager' ? setManager : setStaff;
    setter((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updateRolePermissions({ manager, staff }).unwrap();
      setSaved(true);
    } catch (err: any) {
      setError(err?.data?.error ?? 'Failed to save role permissions');
    }
  }

  if (isLoading) {
    return <LoadingScreen title="Loading roles" subtitle="Fetching the platform permission matrix." />;
  }
  if (isError || !data) {
    return (
      <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load role permissions.</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Roles &amp; Permissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data.updatedAt ? `Last changed ${new Date(data.updatedAt).toLocaleString()}` : 'No changes yet.'}
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/30">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permission
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manager
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {PERMISSION_ROWS.map((row) => (
              <tr key={row.key} className="hover:bg-white/20 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{row.label}</td>
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" checked disabled className="w-4 h-4" />
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={manager.includes(row.key)}
                    onChange={() => toggle('manager', row.key)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={staff.includes(row.key)}
                    onChange={() => toggle('staff', row.key)}
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-6 py-4 border-t border-white/30 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Saved successfully.</p>}
        </div>
      </div>
    </div>
  );
}
