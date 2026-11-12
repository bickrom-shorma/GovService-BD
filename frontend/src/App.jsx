
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import CategoryServices from './pages/CategoryServices';

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
      </Routes>
    </>
  );
}

export default App;
