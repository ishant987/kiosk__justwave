import { Navigate, createBrowserRouter } from 'react-router';
import { LoginPage } from '../features/auth/LoginPage';
import { PackagePaymentPage } from '../features/walk-in/PackagePaymentPage';
import { PrintPassPage } from '../features/walk-in/PrintPassPage';
import { TestStickerPage } from '../features/walk-in/TestStickerPage';
import { WalkInPage } from '../features/walk-in/WalkInPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/walk-in" replace />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/walk-in',
        element: <WalkInPage />
      },
      {
        path: '/walk-in/payment',
        element: <PackagePaymentPage />
      },
      {
        path: '/walk-in/print',
        element: <PrintPassPage />
      },
      {
        path: '/walk-in/test-sticker',
        element: <TestStickerPage />
      }
    ]
  }
]);
