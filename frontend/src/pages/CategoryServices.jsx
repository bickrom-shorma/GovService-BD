
import { useParams } from 'react-router-dom';
import servicesData from '../data/services';
import './CategoryServices.css';

function CategoryServices() {
  const { categoryId } = useParams();

  const category = servicesData[categoryId];

  if (!category) {
    return <h2 className="text-center mt-5">Category Not Found</h2>;
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">
        {category.title}
      </h2>

      <div className="row g-4">
        {category.services.map((service, index) => (
          <div className="col-md-6 col-lg-4" key={index}>
            <div className="service-card">
              <h5>{service}</h5>
              <p>View service requirements and application guide.</p>
              <button className="btn btn-primary">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryServices;
