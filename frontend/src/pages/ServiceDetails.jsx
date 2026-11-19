import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import servicesData from '../data/services';
import serviceDetailsData from '../data/serviceDetailsData';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

import './ServiceDetails.css';

function ServiceDetails() {
  const { categoryId, serviceIndex } = useParams();
  const serviceKey = `${categoryId}-${serviceIndex}`;
  return (
    <ServiceDetailsContent
      key={serviceKey}
      categoryId={categoryId}
      serviceIndex={serviceIndex}
      serviceKey={serviceKey}
    />
  );
}

function ServiceDetailsContent({ categoryId, serviceIndex, serviceKey }) {
  const { t, categoryTitle, serviceName, getServiceDetails, translateMessage } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const staticCategory = servicesData[categoryId];
  const staticService = staticCategory?.services?.[Number(serviceIndex)];
  const staticDetails = serviceDetailsData[serviceKey];

  const [serviceData, setServiceData] = useState(() =>
    staticService
      ? {
          id: serviceKey,
          categoryId,
          categoryName: staticCategory.title,
          serviceName: staticService,
          ...(staticDetails || {}),
        }
      : null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(() => {
    if (isAuthenticated) return false;
    try {
      const savedServices = JSON.parse(
        localStorage.getItem('savedServices') || '[]'
      );
      return savedServices.some((item) => item.id === serviceKey);
    } catch {
      return false;
    }
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest(`/api/services/${serviceKey}`)
      .then((res) => {
        if (active && res?.success && res.data) {
          setServiceData(res.data);
        }
      })
      .catch(() => {
        // Fallback to static service data
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceKey]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let active = true;

    apiRequest('/api/saved-services')
      .then((res) => {
        if (!active) return;
        const list = res?.services || [];
        setIsSaved(list.some((item) => item.service_key === serviceKey));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [serviceKey, authLoading, isAuthenticated]);

  if (!loading && !serviceData) {
    return <h2 className="text-center mt-5">{t('serviceNotFound')}</h2>;
  }

  if (!serviceData) {
    return <p className="text-center mt-5">{t('loading')}</p>;
  }

  const handleSaveService = async () => {
    setSaving(true);
    setStatusMessage('');

    if (isAuthenticated) {
      try {
        if (isSaved) {
          await apiRequest(`/api/saved-services/by-key/${serviceKey}`, {
            method: 'DELETE',
          });
          setIsSaved(false);
        } else {
          await apiRequest('/api/saved-services', {
            method: 'POST',
            body: JSON.stringify({
              service_key: serviceKey,
              category_id: categoryId,
              service_index: Number(serviceIndex),
              service_name: serviceData.serviceName,
              category_name: serviceData.categoryName,
            }),
          });
          setIsSaved(true);
        }
        window.dispatchEvent(new Event('savedServicesUpdated'));
      } catch (err) {
        setStatusMessage(translateMessage(err.message, 'savedServiceError'));
      } finally {
        setSaving(false);
      }
      return;
    }

    const savedServices = JSON.parse(
      localStorage.getItem('savedServices') || '[]'
    );
    const alreadySaved = savedServices.some((item) => item.id === serviceKey);

    let updatedServices;
    if (alreadySaved) {
      updatedServices = savedServices.filter((item) => item.id !== serviceKey);
      setIsSaved(false);
    } else {
      updatedServices = [
        ...savedServices,
        {
          id: serviceKey,
          categoryId,
          serviceIndex: Number(serviceIndex),
          serviceName: serviceData.serviceName,
          categoryName: serviceData.categoryName,
        },
      ];
      setIsSaved(true);
    }

    localStorage.setItem('savedServices', JSON.stringify(updatedServices));
    window.dispatchEvent(new Event('savedServicesUpdated'));
    setSaving(false);
  };

  const localizedDetails = getServiceDetails(serviceKey, serviceData);
  const displayData = localizedDetails || serviceData;

  const hasDetails = Boolean(
    displayData.overview ||
      displayData.requiredDocuments?.length ||
      displayData.officialLink
  );

  const renderContent = () => {
    if (!hasDetails) {
      return (
        <>
          <h3>{t('infoComingSoon')}</h3>
          <p>{t('infoComingSoonDesc')}</p>
        </>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <>
            <h3>{t('tabOverview')}</h3>
            <p>{displayData.overview}</p>
          </>
        );

      case 'documents':
        return (
          <>
            <h3>{t('tabDocuments')}</h3>
            <p>{t('prepareDocsPrompt')}</p>

            <ul className="service-information-list">
              {(displayData.requiredDocuments || []).map((document, index) => (
                <li key={index}>{document}</li>
              ))}
            </ul>
          </>
        );

      case 'guidelines':
        return (
          <>
            <h3>{t('tabGuidelines')}</h3>

            <div className="application-guideline-section">
              <h4>{t('onlineProcess')}</h4>
              <p>{t('onlineProcessPrompt')}</p>

              <ol className="service-information-list">
                {(displayData.applicationSteps?.online || []).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="application-guideline-section">
              <h4>{t('offlineProcess')}</h4>
              <p>{t('offlineProcessPrompt')}</p>

              <ol className="service-information-list">
                {(displayData.applicationSteps?.offline || []).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </>
        );

      case 'official':
        return (
          <>
            <h3>{t('officialFormTitle')}</h3>
            <p>{t('officialFormPrompt')}</p>

            {displayData.officialLink ? (
              <a
                href={displayData.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="official-link-button"
              >
                {t('visitOfficialPortal')}
              </a>
            ) : (
              <p>{t('toBeVerified')}</p>
            )}
          </>
        );

      case 'offices':
        return (
          <>
            <h3>{t('officeInfoTitle')}</h3>
            <p>{displayData.officeInformation || t('toBeVerified')}</p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="service-details-container">

      <Link to={`/category/${categoryId}`} className="back-link">
        {t('backToServices')}
      </Link>

      <div className="service-details-heading">
        <div className="service-heading-icon">📄</div>

        <div>
          <h2>{serviceName(serviceData.serviceName)}</h2>
          <p>
            {categoryTitle(categoryId, serviceData.categoryName)} — {t('serviceSubtitle')}
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`save-service-button ${isSaved ? 'saved' : ''}`}
        onClick={handleSaveService}
        disabled={saving}
      >
        {saving ? t('saving') : isSaved ? t('savedService') : t('saveService')}
      </button>

      {statusMessage && (
        <div className="alert alert-warning py-2 px-3 mb-3">{statusMessage}</div>
      )}

      <div className="alert alert-info py-2 px-3 mb-3" style={{ fontSize: '13px' }}>
        {t('officialVerifyNotice')}
      </div>

      <div className="service-info-cards">

        <div className="info-card">
          <span>💰</span>
          <div>
            <small>{t('estimatedCost')}</small>
            <h4>{displayData.estimatedCost || t('toBeVerified')}</h4>
          </div>
        </div>

        <div className="info-card">
          <span>◷</span>
          <div>
            <small>{t('processingTime')}</small>
            <h4>{displayData.processingTime || t('toBeVerified')}</h4>
          </div>
        </div>

        <div className="info-card">
          <span>🏢</span>
          <div>
            <small>{t('relevantOffice')}</small>
            <h4>{displayData.relevantOffice || t('toBeVerified')}</h4>
          </div>
        </div>

      </div>

      <div className="service-details-layout">

        <aside className="details-sidebar">

          {[
            { id: 'overview', icon: '◉', label: t('tabOverview') },
            { id: 'documents', icon: '▣', label: t('tabDocuments') },
            { id: 'guidelines', icon: '☷', label: t('tabGuidelines') },
            { id: 'official', icon: '↗', label: t('tabOfficial') },
            { id: 'offices', icon: '⌖', label: t('tabOffices') },
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
