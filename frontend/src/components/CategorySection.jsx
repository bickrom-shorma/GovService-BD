import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../utils/api';
import './CategorySection.css';

const defaultCategories = [
  { id: 'nid', title: 'NID Services', icon: '🪪' },
  { id: 'birth-registration', title: 'Birth Registration', icon: '👶' },
  { id: 'passport', title: 'Passport Services', icon: '📘' },
  { id: 'driving-licence', title: 'Driving Licence', icon: '🚗' },
  { id: 'marriage-registration', title: 'Marriage Registration', icon: '💍' },
];

const iconMap = {
  nid: '🪪',
  'birth-registration': '👶',
  passport: '📘',
  'driving-licence': '🚗',
  'marriage-registration': '💍',
};

function CategorySection() {
  const { t, categoryTitle } = useLanguage();
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    apiRequest('/api/services')
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setCategories(
            res.data.map((cat) => ({
              id: cat.categoryId,
              title: cat.categoryName,
              icon: iconMap[cat.categoryId] || '🏛️',
            }))
          );
        }
      })
      .catch(() => {
        // Keep defaultCategories on failure
      });
  }, []);

  return (
    <section className="category-section" id="categories">
      <div className="container">
        <h2 className="text-center mb-5">
          {t('categoriesHeading')}
        </h2>

        <div className="row g-4">
          {categories.map((category) => (
            <div className="col-md-6 col-lg-4" key={category.id}>
              <Link
                to={`/category/${category.id}`}
                className="category-link"
              >
                <div className="category-card">
                  <div className="category-icon">
                    {category.icon}
                  </div>

                  <h5>{categoryTitle(category.id, category.title)}</h5>
                  <p>{t('exploreServices')}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
