import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const {
    t,
    categoryTitle,
    serviceName,
    translateMessage,
    feedbackTypeLabel,
    feedbackStatusLabel,
  } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalSavedServices: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
    totalManagedServices: 0,
  });
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [managedServices, setManagedServices] = useState([]);

  const [serviceForm, setServiceForm] = useState({
    service_key: '',
    category_id: 'nid',
    category_name: 'NID Services',
    service_name: '',
    overview: '',
    estimated_cost: 'To be verified',
    processing_time: 'To be verified',
    relevant_office: '',
    required_documents: '',
    official_link: '',
    office_information: '',
  });

  const [replyDrafts, setReplyDrafts] = useState({});

  const docTypeOptions = t('docTypeOptions');

  const loadAdminData = useCallback(async () => {
    try {
      const [statsRes, usersRes, fbRes, docsRes, srvRes] = await Promise.all([
        apiRequest('/api/admin/stats'),
        apiRequest('/api/admin/users'),
        apiRequest('/api/admin/feedback'),
        apiRequest('/api/admin/documents'),
        apiRequest('/api/admin/services'),
      ]);
      if (statsRes?.stats) setStats(statsRes.stats);
      if (usersRes?.users) setUsers(usersRes.users);
      if (fbRes?.feedbacks) setFeedbacks(fbRes.feedbacks);
      if (docsRes?.documents) setDocuments(docsRes.documents);
      if (srvRes?.services) setManagedServices(srvRes.services);
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminLoadError' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest('/api/admin/stats'),
      apiRequest('/api/admin/users'),
      apiRequest('/api/admin/feedback'),
      apiRequest('/api/admin/documents'),
      apiRequest('/api/admin/services'),
    ])
      .then(([statsRes, usersRes, fbRes, docsRes, srvRes]) => {
        if (!active) return;
        if (statsRes?.stats) setStats(statsRes.stats);
        if (usersRes?.users) setUsers(usersRes.users);
        if (fbRes?.feedbacks) setFeedbacks(fbRes.feedbacks);
        if (docsRes?.documents) setDocuments(docsRes.documents);
        if (srvRes?.services) setManagedServices(srvRes.services);
      })
      .catch((err) => {
        if (active) {
          setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminLoadError' });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUserUpdate = async (userId, nextRole, nextActive) => {
    setNotice(null);
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole, is_active: nextActive }),
      });
      setNotice({ type: 'success', key: 'adminUserUpdated' });
      await loadAdminData();
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminUserUpdateError' });
    }
  };

  const handleFeedbackUpdate = async (fbId, nextStatus) => {
    setNotice(null);
    try {
      await apiRequest(`/api/admin/feedback/${fbId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          admin_response: replyDrafts[fbId] ?? '',
        }),
      });
      setNotice({ type: 'success', key: 'adminFeedbackUpdated' });
      await loadAdminData();
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminFeedbackUpdateError' });
    }
  };

  const handleDeleteDocument = async (docId) => {
    setNotice(null);
    try {
      await apiRequest(`/api/admin/documents/${docId}`, { method: 'DELETE' });
      setNotice({ type: 'success', key: 'adminDocRemoved' });
      await loadAdminData();
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminDocRemoveError' });
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      await apiRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm),
      });
      setNotice({ type: 'success', key: 'adminServiceSaved' });
      setServiceForm({
        service_key: '',
        category_id: 'nid',
        category_name: 'NID Services',
        service_name: '',
        overview: '',
        estimated_cost: 'To be verified',
        processing_time: 'To be verified',
        relevant_office: '',
        required_documents: '',
        official_link: '',
        office_information: '',
      });
      await loadAdminData();
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminServiceSaveError' });
    }
  };

  const handleDeleteManagedService = async (key) => {
    setNotice(null);
    try {
      await apiRequest(`/api/admin/services/${key}`, { method: 'DELETE' });
      setNotice({ type: 'success', key: 'adminServiceDeleted' });
      await loadAdminData();
    } catch (err) {
      setNotice({ type: 'danger', raw: err.message, fallbackKey: 'adminServiceDeleteError' });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>{t('adminTitle')}</h2>
          <p>{t('adminSubtitle')}</p>
        </div>
      </div>

      <div className="admin-tabs">
        {[
          { id: 'overview', label: `📊 ${t('adminTabOverview')}` },
          { id: 'users', label: `👥 ${t('adminTabUsers')} (${users.length})` },
          { id: 'services', label: `🏛️ ${t('adminTabServices')} (${managedServices.length})` },
          { id: 'feedback', label: `💬 ${t('adminTabFeedback')} (${feedbacks.length})` },
          { id: 'documents', label: `📄 ${t('adminTabDocuments')} (${documents.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && (
        <div
          className={`alert alert-${notice.type === 'danger' ? 'danger' : 'success'} py-2 px-3 mb-3`}
          role="alert"
        >
          {notice.key
            ? t(notice.key)
            : translateMessage(notice.raw, notice.fallbackKey)}
        </div>
      )}

      {loading ? (
        <p>{t('loading')}</p>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span>{t('adminStatTotalUsers')}</span>
                <strong>{stats.totalUsers}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{t('adminStatUploadedDocs')}</span>
                <strong>{stats.totalDocuments}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{t('adminStatSavedServices')}</span>
                <strong>{stats.totalSavedServices}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{t('adminStatTotalFeedback')}</span>
                <strong>{stats.totalFeedback}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{t('adminStatPendingFeedback')}</span>
                <strong>{stats.pendingFeedback}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{t('adminStatManagedServices')}</span>
                <strong>{stats.totalManagedServices}</strong>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-panel table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('adminColId')}</th>
                    <th>{t('adminColName')}</th>
                    <th>{t('adminColEmail')}</th>
                    <th>{t('adminColRole')}</th>
                    <th>{t('adminColStatus')}</th>
                    <th>{t('adminColActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                          {u.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active === 0 ? 'bg-danger' : 'bg-success'}`}>
                          {u.is_active === 0 ? t('statusInactive') : t('statusActive')}
                        </span>
                      </td>
                      <td className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            handleUserUpdate(
                              u.id,
                              u.role === 'admin' ? 'user' : 'admin',
                              u.is_active
                            )
                          }
                        >
                          {u.role === 'admin' ? t('makeUser') : t('makeAdmin')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleUserUpdate(u.id, u.role, u.is_active === 0 ? 1 : 0)
                          }
                        >
                          {u.is_active === 0 ? t('activate') : t('deactivate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="admin-panel">
              <h4 className="mb-3">{t('adminAddServiceTitle')}</h4>
              <form className="row g-3 mb-4" onSubmit={handleSaveService}>
                <div className="col-md-4">
                  <label className="form-label">{t('adminServiceKeyLabel')}</label>
                  <input
                    className="form-control"
                    value={serviceForm.service_key}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, service_key: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('adminCategoryLabel')}</label>
                  <select
                    className="form-select"
                    value={serviceForm.category_id}
                    onChange={(e) => {
                      const map = {
                        nid: 'NID Services',
                        'birth-registration': 'Birth Registration',
                        passport: 'Passport Services',
                        'driving-licence': 'Driving Licence',
                        'marriage-registration': 'Marriage Registration',
                      };
                      setServiceForm((p) => ({
                        ...p,
                        category_id: e.target.value,
                        category_name: map[e.target.value] || e.target.value,
                      }));
                    }}
                  >
                    <option value="nid">{categoryTitle('nid', 'NID Services')} (nid)</option>
                    <option value="birth-registration">
                      {categoryTitle('birth-registration', 'Birth Registration')} (birth-registration)
                    </option>
                    <option value="passport">
                      {categoryTitle('passport', 'Passport Services')} (passport)
                    </option>
                    <option value="driving-licence">
                      {categoryTitle('driving-licence', 'Driving Licence')} (driving-licence)
                    </option>
                    <option value="marriage-registration">
                      {categoryTitle('marriage-registration', 'Marriage Registration')} (marriage-registration)
                    </option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('adminServiceNameLabel')}</label>
                  <input
                    className="form-control"
                    value={serviceForm.service_name}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, service_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('adminEstimatedCostLabel')}</label>
                  <input
                    className="form-control"
                    value={serviceForm.estimated_cost}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, estimated_cost: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('adminProcessingTimeLabel')}</label>
                  <input
                    className="form-control"
                    value={serviceForm.processing_time}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, processing_time: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('adminOfficialLinkLabel')}</label>
                  <input
                    className="form-control"
                    value={serviceForm.official_link}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, official_link: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('adminOverviewLabel')}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={serviceForm.overview}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, overview: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('adminRequiredDocsLabel')}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={serviceForm.required_documents}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, required_documents: e.target.value }))
                    }
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary">
                    {t('adminSaveServiceBtn')}
                  </button>
                </div>
              </form>

              <h5>
                {t('adminManagedOverrides')} ({managedServices.length})
              </h5>
              {managedServices.length === 0 ? (
                <p className="text-muted mb-0">{t('adminNoManagedServices')}</p>
              ) : (
                <div className="list-group">
                  {managedServices.map((srv) => (
                    <div
                      key={srv.service_key}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{serviceName(srv.service_name)}</strong> ({srv.service_key})
                        <div className="text-muted small">
                          {categoryTitle(srv.category_id, srv.category_name)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteManagedService(srv.service_key)}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="admin-panel">
              {feedbacks.length === 0 ? (
                <p className="text-muted mb-0">{t('adminNoFeedback')}</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{fb.subject}</strong>
                          <div className="text-muted small">
                            {feedbackTypeLabel(fb.feedback_type)} • {t('adminFeedbackFrom')}{' '}
                            {fb.user_name} ({fb.user_email})
                          </div>
                        </div>
                        <span className="badge bg-info text-dark">
                          {feedbackStatusLabel(fb.status)}
                        </span>
                      </div>
                      <p className="mb-2">{fb.message}</p>
                      <div className="d-flex gap-2 flex-wrap">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          style={{ maxWidth: '380px' }}
                          placeholder={t('adminResponsePlaceholder')}
                          value={replyDrafts[fb.id] ?? fb.admin_response ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((p) => ({ ...p, [fb.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleFeedbackUpdate(fb.id, 'reviewed')}
                        >
                          {t('markReviewed')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => handleFeedbackUpdate(fb.id, 'resolved')}
                        >
                          {t('markResolved')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="admin-panel table-responsive">
              {documents.length === 0 ? (
                <p className="text-muted mb-0">{t('adminNoDocs')}</p>
              ) : (
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>{t('adminColId')}</th>
                      <th>{t('adminColDocName')}</th>
                      <th>{t('adminColType')}</th>
                      <th>{t('adminColOwner')}</th>
                      <th>{t('adminColAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td>{d.document_name}</td>
                        <td>{docTypeOptions[d.document_type] || d.document_type || '—'}</td>
                        <td>{d.user_name} ({d.user_email})</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteDocument(d.id)}
                          >
                            {t('remove')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
