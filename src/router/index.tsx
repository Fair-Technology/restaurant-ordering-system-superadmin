import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { RequireAuth } from '../auth/RequireAuth';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ShopsPage } from '../pages/ShopsPage';
import { OwnersPage } from '../pages/OwnersPage';
import { RejectionWatchPage } from '../pages/RejectionWatchPage';
import { ShopActivityPage } from '../pages/ShopActivityPage';
import { ShopOrdersPage } from '../pages/ShopOrdersPage';
import { PlansPage } from '../pages/PlansPage';
import { EditPlanPage } from '../pages/EditPlanPage';
import { PlanPricingPage } from '../pages/PlanPricingPage';
import { ShopSubscriptionPage } from '../pages/ShopSubscriptionPage';
import { ShopUsagePage } from '../pages/ShopUsagePage';
import { NameChangeRequestsPage } from '../pages/NameChangeRequestsPage';
import { ContentReportsPage } from '../pages/ContentReportsPage';
import { RolePermissionsPage } from '../pages/RolePermissionsPage';
import { ReferenceListsPage } from '../pages/ReferenceListsPage';
import { PlatformLegalPage } from '../pages/PlatformLegalPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'shops', element: <ShopsPage /> },
      { path: 'owners', element: <OwnersPage /> },
      { path: 'shops/:shopId/orders', element: <ShopOrdersPage /> },
      { path: 'shops/:shopId/activity', element: <ShopActivityPage /> },
      { path: 'shops/:shopId/subscription', element: <ShopSubscriptionPage /> },
      { path: 'shops/:shopId/usage', element: <ShopUsagePage /> },
      { path: 'rejection-watch', element: <RejectionWatchPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'plans/:planId', element: <EditPlanPage /> },
      { path: 'plans/:planId/pricing', element: <PlanPricingPage /> },
      { path: 'role-permissions', element: <RolePermissionsPage /> },
      { path: 'reference-lists', element: <ReferenceListsPage /> },
      { path: 'platform-legal', element: <PlatformLegalPage /> },
      { path: 'name-change-requests', element: <NameChangeRequestsPage /> },
      { path: 'content-reports', element: <ContentReportsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
