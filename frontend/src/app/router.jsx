import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import HomePage from "../pages/HomePage";
import ListingsPage from "../pages/ListingsPage";
import PropertyPage from "../pages/PropertyPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import MyBookingsPage from "../pages/MyBookingsPage";
import HostPropertiesPage from "../pages/HostPropertiesPage";
import HostBookingsPage from "../pages/HostBookingsPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminPropertiesPage from "../pages/AdminPropertiesPage";
import HostCreatePropertyPage from "../pages/HostCreatePropertyPage";
import HostEditPropertyPage from "../pages/HostEditPropertyPage";
import ProfilePage from "../pages/ProfilePage";
import PublicProfilePage from "../pages/PublicProfilePage";
import MessagesPage from "../pages/MessagesPage";
import ConversationPage from "../pages/ConversationPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import PaymentCancelPage from "../pages/PaymentCancelPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "listings", element: <ListingsPage /> },
      { path: "properties/:id", element: <PropertyPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      {
        path: "users/:id",
        element: <PublicProfilePage />,
      },

      {
        path: "profile",
        element: (
          <ProtectedRoute allowedRoles={["user", "host", "admin"]}>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "payment/success",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <PaymentSuccessPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "payment/cancel",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <PaymentCancelPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "my-bookings",
        element: (
          <ProtectedRoute allowedRoles={["user"]}>
            <MyBookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "host/properties",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <HostPropertiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "host/properties/create",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <HostCreatePropertyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "host/properties/:id/edit",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <HostEditPropertyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "host/bookings",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <HostBookingsPage />
          </ProtectedRoute>
        ),
      },
      
      {
        path: "admin/users",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/properties",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPropertiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "messages",
        element: (
          <ProtectedRoute allowedRoles={["user", "host", "admin"]}>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "messages/:conversationId",
        element: (
          <ProtectedRoute allowedRoles={["user", "host", "admin"]}>
            <ConversationPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;