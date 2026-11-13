
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import servicesData from '../data/services';
import serviceDetailsData from '../data/serviceDetailsData';

import './ServiceDetails.css';

function ServiceDetails() {
  const { categoryId, serviceIndex } = useParams();

  const category = servicesData[categoryId];
  const service = category?.services?.[Number(serviceIndex)];

  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);

  const serviceKey = `${categoryId}-${serviceIndex}`;

  useEffect(() => {
    const savedServices = JSON.parse(
      localStorage.getItem('savedServices') || '[]'
    );

    setIsSaved(savedServices.some((item) => item.id === serviceKey));
  }, [serviceKey]);

  if (!service) {
    return <h2 className="text-center mt-5">Service not found!</h2>;
  }

  const details = serviceDetailsData[serviceKey];

  const handleSaveService = () => {
    const savedServices = JSON.parse(
      localStorage.getItem('savedServices') || '[]'
    );

    const alreadySaved = savedServices.some(
      (item) => item.id === serviceKey
    );

    let updatedServices;

    if (alreadySaved) {
      updatedServices = savedServices.filter(
        (item) => item.id !== serviceKey
      );
      setIsSaved(false);
    } else {
      updatedServices = [
        ...savedServices,
        {
          id: serviceKey,
          categoryId,
          serviceIndex: Number(serviceIndex),
          serviceName: service,
          categoryName: category.title,
        },
      ];
      setIsSaved(true);
    }

    localStorage.setItem('savedServices', JSON.stringify(updatedServices));

    window.dispatchEvent(new Event('savedServicesUpdated'));
  };

  const renderContent = () => {
    if (!details) {
      return (
        <>
          <h3>Information Coming Soon</h3>
          <p>
            Verified information for this service will be added soon.
          </p>
        </>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <>
            <h3>Overview</h3>
            <p>{details.overview}</p>
          </>
        );

      case 'documents':
        return (
          <>
            <h3>Required Documents</h3>
            <p>Please prepare the following documents:</p>

            <ul className="service-information-list">
              {details.requiredDocuments.map((document, index) => (
                <li key={index}>{document}</li>
              ))}
            </ul>
          </>
        );

      case 'guidelines':
        return (
          <>
            <h3>Application Guidelines</h3>

            <div className="application-guideline-section">
              <h4>Online Application Process</h4>
              <p>Follow these steps to apply online:</p>

              <ol className="service-information-list">
                {details.applicationSteps.online.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="application-guideline-section">
              <h4>Offline Application Process</h4>
              <p>
                Follow these steps to apply directly through a government office:
              </p>

              <ol className="service-information-list">
                {details.applicationSteps.offline.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </>
        );

      case 'official':
        return (
          <>
            <h3>Official Application Form</h3>
            <p>
              Apply through the official government portal.
            </p>

            <a
              href={details.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="official-link-button"
            >
              Visit Official Application Portal ↗
            </a>
          </>
        );

      case 'offices':
        return (
          <>
            <h3>Government Office Information</h3>
            <p>{details.officeInformation}</p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="service-details-container">

      <Link to={`/category/${categoryId}`} className="back-link">
        ← Back to Services
      </Link>

      <div className="service-details-heading">
        <div className="service-heading-icon">📄</div>

        <div>
          <h2>{service}</h2>
          <p>
            Get information and guidance for this government service.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`save-service-button ${isSaved ? 'saved' : ''}`}
        onClick={handleSaveService}
      >
        {isSaved ? '★ Saved' : '☆ Save Service'}
      </button>

      <div className="service-info-cards">

        <div className="info-card">
          <span>💰</span>
          <div>
            <small>Estimated Cost</small>
            <h4>{details?.estimatedCost || 'To be verified'}</h4>
          </div>
        </div>

        <div className="info-card">
          <span>◷</span>
          <div>
            <small>Processing Time</small>
            <h4>{details?.processingTime || 'To be verified'}</h4>
          </div>
        </div>

        <div className="info-card">
          <span>🏢</span>
          <div>
            <small>Relevant Office</small>
            <h4>{details?.relevantOffice || 'To be verified'}</h4>
          </div>
        </div>

      </div>

      <div className="service-details-layout">

        <aside className="details-sidebar">

          {[
            { id: 'overview', icon: '◉', label: 'Overview' },
            { id: 'documents', icon: '▣', label: 'Required Documents' },
            { id: 'guidelines', icon: '☷', label: 'Application Guidelines' },
            { id: 'official', icon: '↗', label: 'Official Form Link' },
            { id: 'offices', icon: '⌖', label: 'Nearby Offices' },
          ].map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

        </aside>

        <main className="details-content-panel">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}

export default ServiceDetails;
