import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Technologies from './pages/Technologies';
import Interfaces from './pages/Interfaces';
import Persons from './pages/Persons';
import PersonDetail from './pages/PersonDetail';
import Dependencies from './pages/Dependencies';
import ArchitectureMap from './pages/ArchitectureMap';
import ImpactAnalysis from './pages/ImpactAnalysis';
import BusinessApplications from './pages/BusinessApplications';
import BusinessApplicationDetail from './pages/BusinessApplicationDetail';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/applications/:id" element={<ApplicationDetail />} />
                  <Route path="/business-applications" element={<BusinessApplications />} />
                  <Route path="/business-applications/:id" element={<BusinessApplicationDetail />} />
                  <Route path="/technologies" element={<Technologies />} />
                  <Route path="/interfaces" element={<Interfaces />} />
                  <Route path="/persons" element={<Persons />} />
                  <Route path="/persons/:id" element={<PersonDetail />} />
                  <Route path="/dependencies" element={<Dependencies />} />
                  <Route path="/architecture-map" element={<ArchitectureMap />} />
                  <Route path="/impact-analysis" element={<ImpactAnalysis />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Box>
  );
}

export default App;
