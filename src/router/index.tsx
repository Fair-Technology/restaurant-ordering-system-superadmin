import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { RequireAuth } from '../auth/RequireAuth';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ShopsPage } from '../pages/ShopsPage';
import { ShopActivityPage } from '../pages/ShopActivityPage';
import { ShopOrdersPage } from '../pages/ShopOrdersPage';
import { PlansPage } from '../pages/PlansPage';
import { EditPlanPage } from '../pages/EditPlanPage';
import { PlanPricingPage } from '../pages/PlanPricingPage';
import { ShopSubscriptionPage } from '../pages/ShopSubscriptionPage';
import { ShopUsagePage } from '../pages/ShopUsagePage';
import { NameChangeRequestsPage } from '../pages/NameChangeRequestsPage';
import { RolePermissionsPage } from '../pages/RolePermissionsPage';
import { ReferenceListsPage } from '../pages/ReferenceListsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'shops', element: <ShopsPage /> },
      { path: 'shops/:shopId/orders', element: <ShopOrdersPage /> },
      { path: 'shops/:shopId/activity', element: <ShopActivityPage /> },
      { path: 'shops/:shopId/subscription', element: <ShopSubscriptionPage /> },
      { path: 'shops/:shopId/usage', element: <ShopUsagePage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'plans/:planId', element: <EditPlanPage /> },
      { path: 'plans/:planId/pricing', element: <PlanPricingPage /> },
      { path: 'role-permissions', element: <RolePermissionsPage /> },
      { path: 'reference-lists', element: <ReferenceListsPage /> },
      { path: 'name-change-requests', element: <NameChangeRequestsPage /> },
    ],
  },
]);
