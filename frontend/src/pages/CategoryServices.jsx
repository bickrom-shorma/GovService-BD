
import { useParams, Link } from 'react-router-dom';
import servicesData from '../data/services';
import './CategoryServices.css';

function CategoryServices() {
  const { categoryId } = useParams();

  const category = servicesData[categoryId];

  if (!category) {
    return <h2 className="text-center mt-5">Category not found!</h2>;
  }

  return (
    <div className="category-services-container">
      <h2>{category.title}</h2>

      <div className="services-list">
        {category.services.map((service, index) => (
          <Link
            to={`/category/${categoryId}/service/${index}`}
            key={index}
            className="service-card"
          >
            <span>{service}</span>
            <span>View Details →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CategoryServices;
