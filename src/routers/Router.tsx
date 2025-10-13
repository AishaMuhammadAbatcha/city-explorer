import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/layout/dashboard/Layout";
import Login from "@/pages/auth/Login";
import BusinessDashboard from "@/roles/business/pages/BusinessDashboard";
import BusinessEvents from "@/roles/business/pages/BusinessEvents";
import BusinessDeals from "@/roles/business/pages/BusinessDeals";
import BusinessReviews from "@/roles/business/pages/BusinessReviews";
import BusinessAnalytics from "@/roles/business/pages/BusinessAnalytics";
import BusinessNotifications from "@/roles/business/pages/BusinessNotifications";
import BusinessSettings from "@/roles/business/pages/BusinessSettings";
import Dashboard from "@/roles/individual/pages/Dashboard";
import Explore from "@/roles/individual/pages/Explore";
import ExploreAI from "@/roles/individual/pages/ExploreAI";
import ExploreMaps from "@/roles/individual/pages/ExploreMaps";
import Profile from "@/roles/individual/pages/Profile";
import BusinessPage from "@/roles/business/pages/BusinessPage";
import Interests from "@/roles/individual/pages/Interests";
import EditProfile from "@/roles/individual/pages/EditProfile";
import PaymentPage from "@/roles/individual/pages/PaymentPage";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'individual' | 'business';
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Always show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to login if we're done loading and there's no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && profile?.role !== requiredRole) {
    // If we don't have a profile yet but user exists, let them access (will show error if profile needed)
    if (!profile) {
      console.warn('User exists but profile not loaded, allowing access');
    } else {
      // Redirect to appropriate dashboard based on actual role
      const redirectPath = profile.role === 'business' ? '/business/dashboard' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

const NoNav = () => (
  <>
    <Outlet />
  </>
);

const Router = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (user && profile && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup")) {
      const redirectPath = profile.role === 'business' ? '/business/dashboard' : '/dashboard';
      navigate(redirectPath);
    }
  }, [user, profile, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<NoNav />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/interests" element={<Interests />} />
      </Route>

      {/* Business routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="business">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/business/dashboard" element={<BusinessDashboard />} />
        <Route path="/business/events" element={<BusinessEvents />} />
        <Route path="/business/deals" element={<BusinessDeals />} />
        <Route path="/business/reviews" element={<BusinessReviews />} />
        <Route path="/business/analytics" element={<BusinessAnalytics />} />
        <Route path="/business/notifications" element={<BusinessNotifications />} />
        <Route path="/business/settings" element={<BusinessSettings />} />
      </Route>

      {/* Individual user routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="individual">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/ai" element={<ExploreAI />} />
        <Route path="/maps" element={<ExploreMaps />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Route>

      {/* Shared protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/business/:id" element={<BusinessPage />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-700">404</h1>
            <p className="text-gray-600">Page not found</p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default Router;
