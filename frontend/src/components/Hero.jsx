
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import servicesData from '../data/services';
import './Hero.css';

function Hero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const results = Object.entries(servicesData).flatMap(
      ([categoryId, category]) =>
        category.services
          .map((service, index) => ({
            serviceName: service,
            categoryName: category.title,
            categoryId,
            serviceIndex: index,
          }))
          .filter((item) =>
            item.serviceName.toLowerCase().includes(query) ||
            item.categoryName.toLowerCase().includes(query)
          )
    );

    setSearchResults(results);
    setSearched(true);
  };

  const handleResultClick = (result) => {
    navigate(
      `/category/${result.categoryId}/service/${result.serviceIndex}`
    );
  };

  return (
    <section className="hero-section">
      <div className="container text-center">

        <h1>Get Government Services Online</h1>

        <p className="hero-description">
          Find government services, required documents,
          fees and application guidelines in one place.
        </p>

        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder="Search government services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {searched && (
          <div className="search-results">

            <h5>
              Search Results ({searchResults.length})
            </h5>

            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  className="search-result-item"
                  key={`${result.categoryId}-${result.serviceIndex}`}
                  onClick={() => handleResultClick(result)}
                >
                  <div>
                    <strong>{result.serviceName}</strong>
                    <small>{result.categoryName}</small>
                  </div>

                  <span>View Details →</span>
                </div>
              ))
            ) : (
              <p className="no-search-result">
                No services found. Please try another keyword.
              </p>
            )}

          </div>
        )}

        <div className="popular-services">
          <p>Popular Services:</p>

          <span>NID Services</span>
          <span>Birth Registration</span>
          <span>Passport</span>
        </div>

      </div>
    </section>
  );
}

export default Hero;
