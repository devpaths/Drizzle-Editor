import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/dashboard/Login";
import SignUp from "./components/dashboard/SignUp";
import ForgotPassword from "./components/dashboard/ForgotPassword";
import UpdatePassword from "./components/dashboard/UpdatePassword";
import Editor from "./components/editor/Editor";
import LandingPage from "./components/home/header";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-neutral-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route path="/landing-page" element={<LandingPage />} />
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/editor/:id"
        element={user ? <Editor /> : <Navigate to="/login" replace />}
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <SignUp /> : <Navigate to="/dashboard" replace />}
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
    </Routes>
  );
}

export default App;
