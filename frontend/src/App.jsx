import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import ProtectedRoute from './components/ProtectedRoute';

import CategoryServices from './pages/CategoryServices';
import ServiceDetails from './pages/ServiceDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyDocuments from './pages/MyDocuments';
import AIAssistant from './pages/AIAssistant';
import AdminDashboard from './pages/AdminDashboard';

function Home() {
  return (
    <>
      <Hero />
      <CategorySection />
    </>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/category/:categoryId"
          element={<CategoryServices />}
        />

        <Route
          path="/category/:categoryId/service/:serviceIndex"
          element={<ServiceDetails />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/my-documents" element={<MyDocuments />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
