
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';

import CategoryServices from './pages/CategoryServices';
import ServiceDetails from './pages/ServiceDetails';

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
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Category Services Page */}
        <Route
          path="/category/:categoryId"
          element={<CategoryServices />}
        />

        {/* Service Details Page */}
        <Route
          path="/category/:categoryId/service/:serviceIndex"
          element={<ServiceDetails />}
        />
      </Routes>
    </>
  );
}

export default App;
