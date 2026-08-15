import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import PublicRoute from "./components/PublicRoute";

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function HomeRedirect() {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            PUBLIC AUTH PAGE
            ======================================== */}

        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        

        {/* ========================================
            PROTECTED APPLICATION PAGES
            ======================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Transactions />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Categories />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ========================================
            UNKNOWN ROUTES
            ======================================== */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
