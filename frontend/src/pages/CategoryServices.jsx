import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import servicesData from '../data/services';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../utils/api';
import './CategoryServices.css';

function CategoryServices() {
  const { categoryId } = useParams();
  return <CategoryServicesContent key={categoryId} categoryId={categoryId} />;
}

function CategoryServicesContent({ categoryId }) {
  const { t, categoryTitle, serviceName } = useLanguage();

  const fallbackCategory = servicesData[categoryId];
  const [categoryInfo, setCategoryInfo] = useState(() =>
    fallbackCategory
      ? {
          categoryName: fallbackCategory.title,
          services: fallbackCategory.services.map((name, index) => ({
            id: `${categoryId}-${index}`,
            serviceIndex: index,
            serviceName: name,
          })),
        }
      : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest(`/api/services/category/${categoryId}`)
      .then((res) => {
        if (!active) return;
        if (res?.success && Array.isArray(res.data)) {
          setCategoryInfo({
            categoryName: res.categoryName,
            services: res.data.map((srv, index) => ({
              id: srv.id,
              serviceIndex: srv.serviceIndex ?? index,
              serviceName: srv.serviceName,
            })),
          });
        }
      })
      .catch(() => {
        // Keep fallback
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryId]);

  if (!loading && !categoryInfo) {
    return <h2 className="text-center mt-5">{t('categoryNotFound')}</h2>;
  }

  if (!categoryInfo) {
    return <p className="text-center mt-5">{t('loading')}</p>;
  }

  return (
    <div className="category-services-container">
      <Link to="/" className="back-link d-inline-block mb-3">
        {t('backToHome')}
      </Link>
      <h2>{categoryTitle(categoryId, categoryInfo.categoryName)}</h2>

      <div className="services-list">
        {categoryInfo.services.map((service, index) => {
          const idx = service.serviceIndex ?? index;
          return (
            <Link
              to={`/category/${categoryId}/service/${idx}`}
              key={service.id || idx}
              className="service-card"
            >
              <span>{serviceName(service.serviceName)}</span>
              <span>{t('viewDetails')}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryServices;
