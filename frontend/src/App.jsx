import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RemoteControl from './pages/RemoteControl';
import DebugSandbox from './pages/DebugSandbox';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/debug" element={<DebugSandbox />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/control/:id" element={<ProtectedRoute><RemoteControl /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="w-full h-full min-h-screen text-white bg-darkBase">
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
