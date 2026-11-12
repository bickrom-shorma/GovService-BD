
import { Link } from 'react-router-dom';
import './CategorySection.css';

const categories = [
  { id: 'nid', title: 'NID Services', icon: '🪪' },
  { id: 'birth-registration', title: 'Birth Registration', icon: '👶' },
  { id: 'passport', title: 'Passport Services', icon: '📘' },
  { id: 'driving-licence', title: 'Driving Licence', icon: '🚗' },
  { id: 'marriage-registration', title: 'Marriage Registration', icon: '💍' },
];

function CategorySection() {
  return (
    <section className="category-section" id="categories">
      <div className="container">
        <h2 className="text-center mb-5">
          Government Service Categories
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

                  <h5>{category.title}</h5>
                  <p>Explore available services</p>
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
