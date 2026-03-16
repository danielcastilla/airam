import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Technologies from './pages/Technologies';
import TechnologyDetail from './pages/TechnologyDetail';
import Interfaces from './pages/Interfaces';
import InterfaceDetail from './pages/InterfaceDetail';
import Persons from './pages/Persons';
import PersonDetail from './pages/PersonDetail';
import Dependencies from './pages/Dependencies';
import DependencyDetail from './pages/DependencyDetail';
import ArchitectureMap from './pages/ArchitectureMap';
import ImpactAnalysis from './pages/ImpactAnalysis';
import BusinessApplications from './pages/BusinessApplications';
import BusinessApplicationDetail from './pages/BusinessApplicationDetail';
import AdminTemplates from './pages/AdminTemplates';
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
                  <Route path="/technologies/:id" element={<TechnologyDetail />} />
                  <Route path="/interfaces" element={<Interfaces />} />
                  <Route path="/interfaces/:id" element={<InterfaceDetail />} />
                  <Route path="/persons" element={<Persons />} />
                  <Route path="/persons/:id" element={<PersonDetail />} />
                  <Route path="/dependencies" element={<Dependencies />} />
                  <Route path="/dependencies/:id" element={<DependencyDetail />} />
                  <Route path="/architecture-map" element={<ArchitectureMap />} />
                  <Route path="/impact-analysis" element={<ImpactAnalysis />} />
                  <Route path="/admin-templates" element={<AdminTemplates />} />
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
