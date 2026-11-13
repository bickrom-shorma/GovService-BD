
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';

import CategoryServices from './pages/CategoryServices';
import ServiceDetails from './pages/ServiceDetails';
import Login from './pages/Login';
import Register from './pages/Register';

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
      </Routes>
    </>
  );
}

export default App;
