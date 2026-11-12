import { useParams } from 'react-router-dom';
import servicesData from '../data/services';
import './ServiceDetails.css';

function ServiceDetails() {
  const { categoryId, serviceIndex } = useParams();

  const category = servicesData[categoryId];
  const service = category?.services?.[Number(serviceIndex)];

  if (!service) {
    return <h2 className="text-center mt-5">Service not found!</h2>;
  }

  return (
    <div className="service-details-container">
      <h2>{service}</h2>

      <section className="details-section">
        <h4>Required Documents</h4>
        <p>Required documents will be added here.</p>
      </section>

      <section className="details-section">
        <h4>Estimated Cost</h4>
        <p>Cost information will be added here.</p>
      </section>

      <section className="details-section">
        <h4>Processing Time</h4>
        <p>Processing time will be added here.</p>
      </section>

      <section className="details-section">
        <h4>Government Office Information</h4>
        <p>Government office information will be added here.</p>
      </section>

      <section className="details-section">
        <h4>Official Application Link</h4>
        <p>Official link will be added here.</p>
      </section>

      <section className="details-section">
        <h4>Step-by-step Application Guide</h4>
        <p>Application steps will be added here.</p>
      </section>
    </div>
  );
}

export default ServiceDetails;