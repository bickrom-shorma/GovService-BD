import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import servicesData from '../data/services';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../utils/api';
import './Hero.css';

function Hero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [catalog, setCatalog] = useState(null);

  const navigate = useNavigate();
  const { t, categoryTitle, serviceName } = useLanguage();

  useEffect(() => {
    apiRequest('/api/services')
      .then((res) => {
        if (res?.data) {
          setCatalog(res.data);
        }
      })
      .catch(() => {
        // Fallback to static servicesData silently
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const sourceList = catalog
      ? catalog.flatMap((cat) =>
          cat.services.map((srv, idx) => ({
            serviceName: srv.serviceName,
            translatedServiceName: serviceName(srv.serviceName),
            categoryName: cat.categoryName,
            translatedCategoryName: categoryTitle(cat.categoryId, cat.categoryName),
            categoryId: cat.categoryId,
            serviceIndex: srv.serviceIndex ?? idx,
            serviceKey: srv.id,
          }))
        )
      : Object.entries(servicesData).flatMap(([categoryId, category]) =>
          category.services.map((srv, index) => ({
            serviceName: srv,
            translatedServiceName: serviceName(srv),
            categoryName: category.title,
            translatedCategoryName: categoryTitle(categoryId, category.title),
            categoryId,
            serviceIndex: index,
            serviceKey: `${categoryId}-${index}`,
          }))
        );

    const results = sourceList.filter(
      (item) =>
        item.serviceName.toLowerCase().includes(query) ||
        item.translatedServiceName.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.translatedCategoryName.toLowerCase().includes(query)
    );

    setSearchResults(results);
    setSearched(true);
  };

  
  const handleResultClick = (result) => {
    navigate(`/category/${result.categoryId}/service/${result.serviceIndex}`);
  };

  return (
    <section className="hero-section">
      <div className="container text-center">

        <h1>{t('heroTitle')}</h1>

        <p className="hero-description">
          {t('heroDesc')}
        </p>

        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button type="submit" className="btn btn-primary">
            {t('searchBtn')}
          </button>
        </form>

        {searched && (
          <div className="search-results">

            <h5>
              {t('searchResults')} ({searchResults.length})
            </h5>

            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  className="search-result-item"
                  key={result.serviceKey}
                  onClick={() => handleResultClick(result)}
                >
                  <div>
                    <strong>{result.translatedServiceName}</strong>
                    <small>{result.translatedCategoryName}</small>
                  </div>

                  <span>{t('viewDetails')}</span>
                </div>
              ))
            ) : (
              <p className="no-search-result">
                {t('noSearchResult')}
              </p>
            )}

          </div>
        )}

        <div className="popular-services">
          <p>{t('popularServices')}</p>

          <span onClick={() => navigate('/category/nid')} style={{ cursor: 'pointer' }}>
            {categoryTitle('nid', 'NID Services')}
          </span>
          <span onClick={() => navigate('/category/birth-registration')} style={{ cursor: 'pointer' }}>
            {categoryTitle('birth-registration', 'Birth Registration')}
          </span>
          <span onClick={() => navigate('/category/passport')} style={{ cursor: 'pointer' }}>
            {categoryTitle('passport', 'Passport Services')}
          </span>
        </div>

      </div>
    </section>
  );
}
export default Hero ;

