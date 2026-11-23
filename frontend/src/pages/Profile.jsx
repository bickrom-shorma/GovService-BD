import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import servicesData from '../data/services';
import serviceDetailsData from '../data/serviceDetailsData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest, fetchProtectedBlob } from '../utils/api';
import './Profile.css';

const initialProfile = {
  fullName: '',
  phone: '',
  nidNumber: '',
  dateOfBirth: '',
  fatherName: '',
  motherName: '',
  gender: '',
  email: '',
  maritalStatus: '',
  occupation: '',
  presentAddress: {
    division: '',
    district: '',
    upazila: '',
    union: '',
    village: '',
  },
  permanentAddress: {
    division: '',
    district: '',
    upazila: '',
    union: '',
    village: '',
  },
};

const allServices = Object.entries(servicesData).flatMap(
  ([categoryId, category]) =>
    category.services.map((service, index) => ({
      id: `${categoryId}-${index}`,
      categoryId,
      serviceIndex: index,
      serviceName: service,
      categoryName: category.title,
    }))
);

function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const {
    t,
    categoryTitle,
    serviceName,
    getServiceDetails,
    translateMessage,
    feedbackTypeLabel,
    feedbackStatusLabel,
    overviewCardDesc,
  } = useLanguage();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [statusNotice, setStatusNotice] = useState(null);

  const [profile, setProfile] = useState({
    ...initialProfile,
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [savedSnapshot, setSavedSnapshot] = useState(profile);

  const [savedServices, setSavedServices] = useState([]);
  const [selectedChecklistService, setSelectedChecklistService] = useState(
    allServices[0]?.id || ''
  );
  const [checklistProgress, setChecklistProgress] = useState({});

  const [downloadHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('downloadHistory') || '[]');
    } catch {
      return [];
    }
  });

  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({
    feedback_type: 'Suggestion',
    subject: '',
    message: '',
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const menuItems = useMemo(
    () => [
      { key: 'Overview', label: t('menuOverview'), icon: '📊' },
      { key: 'Personal Information', label: t('menuPersonal'), icon: '👤' },
      { key: 'Saved Services', label: t('menuSaved'), icon: '⭐' },
      { key: 'My Document Checklist', label: t('menuChecklist'), icon: '📋' },
      { key: 'My Downloads', label: t('menuDownloads'), icon: '📁' },
      { key: 'Feedback & Reports', label: t('menuFeedback'), icon: '💬' },
      { key: 'Account Settings', label: t('menuSettings'), icon: '⚙️' },
    ],
    [t]
  );

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiRequest('/api/users/profile'),
      apiRequest('/api/saved-services'),
      apiRequest('/api/checklists'),
      apiRequest('/api/feedback'),
    ])
      .then(([profileSettled, savedSettled, checklistSettled, feedbackSettled]) => {
        if (!active) return;

        if (profileSettled.status === 'fulfilled' && profileSettled.value?.profile) {
          const loaded = profileSettled.value.profile;
          const merged = {
            ...initialProfile,
            ...loaded,
            presentAddress: {
              ...initialProfile.presentAddress,
              ...(loaded.presentAddress || {}),
            },
            permanentAddress: {
              ...initialProfile.permanentAddress,
              ...(loaded.permanentAddress || {}),
            },
          };
          setProfile(merged);
          setSavedSnapshot(merged);
        } else if (profileSettled.status === 'rejected') {
          setStatusNotice({
            type: 'danger',
            raw: profileSettled.reason?.message,
            fallbackKey: 'profileLoadError',
          });
        }

        if (
          savedSettled.status === 'fulfilled' &&
          Array.isArray(savedSettled.value?.services)
        ) {
          setSavedServices(savedSettled.value.services);
        }

        if (
          checklistSettled.status === 'fulfilled' &&
          Array.isArray(checklistSettled.value?.checklists)
        ) {
          const mapped = {};
          checklistSettled.value.checklists.forEach((row) => {
            if (!mapped[row.service_key]) mapped[row.service_key] = {};
            mapped[row.service_key][row.document_name] = Boolean(row.is_completed);
          });
          setChecklistProgress(mapped);
        }

        if (
          feedbackSettled.status === 'fulfilled' &&
          Array.isArray(feedbackSettled.value?.feedbacks)
        ) {
          setFeedbacks(feedbackSettled.value.feedbacks);
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const refreshSaved = async () => {
      try {
        const res = await apiRequest('/api/saved-services');
        if (Array.isArray(res?.services)) setSavedServices(res.services);
      } catch {
        // ignore
      }
    };
    window.addEventListener('savedServicesUpdated', refreshSaved);
    return () => window.removeEventListener('savedServicesUpdated', refreshSaved);
  }, []);

  const selectedChecklist = useMemo(
    () => allServices.find((item) => item.id === selectedChecklistService),
    [selectedChecklistService]
  );

  const rawChecklistDetails = serviceDetailsData[selectedChecklistService];
  const localizedChecklistDetails = getServiceDetails(
    selectedChecklistService,
    rawChecklistDetails
  );
  const canonicalDocuments = rawChecklistDetails?.requiredDocuments || [];
  const displayedDocuments =
    localizedChecklistDetails?.requiredDocuments || canonicalDocuments;

  const completedDocuments = canonicalDocuments.filter(
    (doc) => checklistProgress[selectedChecklistService]?.[doc]
  ).length;

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    if (name.includes('.')) {
      const [addressType, field] = name.split('.');
      setProfile((previous) => ({
        ...previous,
        [addressType]: {
          ...previous[addressType],
          [field]: value,
        },
      }));
      return;
    }

    setProfile((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setStatusNotice(null);
    setSavingProfile(true);

    try {
      const res = await apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      const updatedProfile = res?.profile
        ? {
            ...initialProfile,
            ...res.profile,
            email: res.profile.email || profile.email,
            presentAddress: {
              ...initialProfile.presentAddress,
              ...(res.profile.presentAddress || {}),
            },
            permanentAddress: {
              ...initialProfile.permanentAddress,
              ...(res.profile.permanentAddress || {}),
            },
          }
        : profile;
      setProfile(updatedProfile);
      setSavedSnapshot(updatedProfile);
      setIsEditing(false);
      await refreshUser();
      setStatusNotice({ type: 'success', key: 'profileUpdated' });
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'profileUpdateError',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setProfile(savedSnapshot);
    setIsEditing(false);
  };

  const handleChecklistChange = async (docName, checked) => {
    setStatusNotice(null);
    setChecklistProgress((previous) => ({
      ...previous,
      [selectedChecklistService]: {
        ...previous[selectedChecklistService],
        [docName]: checked,
      },
    }));

    try {
      await apiRequest('/api/checklists/toggle', {
        method: 'PUT',
        body: JSON.stringify({
          service_key: selectedChecklistService,
          document_name: docName,
          is_completed: checked,
        }),
      });
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'checklistSaveError',
      });
    }
  };

  const handleRemoveSavedService = async (id) => {
    setStatusNotice(null);
    try {
      await apiRequest(`/api/saved-services/${id}`, { method: 'DELETE' });
      setSavedServices((prev) => prev.filter((item) => item.id !== id));
      window.dispatchEvent(new Event('savedServicesUpdated'));
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'savedServiceRemoveError',
      });
    }
  };

  const handleDownloadAgain = async (item) => {
    if (!item.docId) return;
    try {
      const blob = await fetchProtectedBlob(`/api/documents/${item.docId}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'downloadUnavailable',
      });
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setStatusNotice(null);
    setSubmittingFeedback(true);

    try {
      await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackForm),
      });
      setFeedbackForm({ feedback_type: 'Suggestion', subject: '', message: '' });
      const res = await apiRequest('/api/feedback');
      setFeedbacks(res?.feedbacks || []);
      setStatusNotice({ type: 'success', key: 'feedbackSubmitted' });
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'feedbackSubmitError',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await apiRequest(`/api/feedback/${id}`, { method: 'DELETE' });
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'feedbackDeleteError',
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setStatusNotice(null);

    if (passwordForm.newPassword.length < 8) {
      setStatusNotice({ type: 'danger', key: 'passwordMinLength' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusNotice({ type: 'danger', key: 'passwordMismatch' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordForm),
      });
      setStatusNotice({
        type: 'success',
        raw: res.message,
        fallbackKey: 'passwordUpdated',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        raw: err.message,
        fallbackKey: 'passwordUpdateError',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeMenuItem = menuItems.find((m) => m.key === activeSection);

  const renderContent = () => {
    if (loadingProfile) {
      return <p>{t('loading')}</p>;
    }

    switch (activeSection) {
      case 'Overview':
        return (
          <div className="account-overview">
            <h2>{t('overviewTitle')}</h2>
            <p>{t('overviewDesc')}</p>

            <div className="overview-profile-card">
              <div className="overview-avatar">👤</div>
              <div>
                <h3>{profile.fullName || t('welcomeUser')}</h3>
                <p>{profile.email || t('yourEmail')}</p>
              </div>
            </div>

            <div className="overview-cards">
              {menuItems.slice(1).map((item) => (
                <button
                  type="button"
                  className="overview-card"
                  key={item.key}
                  onClick={() => {
                    setStatusNotice(null);
                    setActiveSection(item.key);
                  }}
                >
                  <span>{item.icon}</span>
                  <h3>{item.label}</h3>
                  <p>{overviewCardDesc(item.key)}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'Personal Information':
        return (
          <div className="account-section">
            <div className="profile-section-header">
              <div>
                <h2>{t('menuPersonal')}</h2>
                <p>{t('personalInfoDesc')}</p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="account-action-button"
                  onClick={() => setIsEditing(true)}
                >
                  {t('editProfile')}
                </button>
              )}
            </div>

            <form className="profile-form" onSubmit={handleProfileSave}>
              <div className="profile-subsection">
                <h3>{t('personalDetails')}</h3>
                <p>{t('personalDetailsDesc')}</p>
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="fullName">{t('fullNameLabel')}</label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder={t('fullNamePlaceholder')}
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="phone">{t('mobileNumber')}</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder={t('phonePlaceholder')}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="nidNumber">{t('nidNumber')}</label>
                  <input
                    id="nidNumber"
                    name="nidNumber"
                    value={profile.nidNumber}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="dateOfBirth">{t('dateOfBirth')}</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="fatherName">{t('fatherName')}</label>
                  <input
                    id="fatherName"
                    name="fatherName"
                    value={profile.fatherName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="motherName">{t('motherName')}</label>
                  <input
                    id="motherName"
                    name="motherName"
                    value={profile.motherName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="gender">{t('gender')}</label>
                  <select
                    id="gender"
                    name="gender"
                    value={profile.gender}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="">{t('selectGender')}</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="email">{t('emailLabel')}</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="maritalStatus">{t('maritalStatus')}</label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={profile.maritalStatus}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="">{t('selectMarital')}</option>
                    <option value="Single">{t('single')}</option>
                    <option value="Married">{t('married')}</option>
                    <option value="Divorced">{t('divorced')}</option>
                    <option value="Widowed">{t('widowed')}</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="occupation">{t('occupation')}</label>
                  <input
                    id="occupation"
                    name="occupation"
                    value={profile.occupation}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="profile-subsection">
                <h3>{t('addressInfo')}</h3>
                <p>{t('addressInfoDesc')}</p>
              </div>

              {['presentAddress', 'permanentAddress'].map((type) => (
                <div className="profile-address-card" key={type}>
                  <h3>
                    {type === 'presentAddress'
                      ? t('presentAddress')
                      : t('permanentAddress')}
                  </h3>

                  <div className="profile-form-grid">
                    {[
                      ['division', t('division')],
                      ['district', t('district')],
                      ['upazila', t('upazila')],
                      ['union', t('union')],
                      ['village', t('village')],
                    ].map(([field, label]) => (
                      <div className="profile-form-group" key={field}>
                        <label htmlFor={`${type}-${field}`}>{label}</label>
                        <input
                          id={`${type}-${field}`}
                          name={`${type}.${field}`}
                          value={profile[type][field]}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isEditing && (
                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="account-action-button"
                    disabled={savingProfile}
                  >
                    {savingProfile ? t('savingChanges') : t('saveChanges')}
                  </button>
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleProfileCancel}
                  >
                    {t('cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        );

      case 'Saved Services':
        return (
          <div className="account-section">
            <h2>{t('menuSaved')}</h2>
            <p>{t('savedServicesDesc')}</p>

            {savedServices.length === 0 ? (
              <div className = "account-empty-state">
                <span>⭐</span>
                <h3>{t('noSavedTitle')}</h3>
                <p>{t('noSavedDesc')}</p>
                <Link to="/" className="account-action-link">
                  {t('exploreServicesBtn')}
                </Link>
              </div>
            ) : (
              <div className="saved-services-list">
                {savedServices.map((item) => (
                  <div className="saved-service-item" key={item.id}>
                    <div className="saved-service-info">
                      <h3>⭐ {serviceName(item.service_name)}</h3>
                      <p>{categoryTitle(item.category_id, item.category_name)}</p>
                      <Link
                        to={`/category/${item.category_id}/service/${item.service_index ?? 0}`}
                        className="account-action-link"
                      >
                        {t('viewDetails').replace(' →', '')}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSavedService(item.id)}
                    >
                      {t('remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'My Document Checklist':
        return (
          <div className="account-section">
            <h2>{t('menuChecklist')}</h2>
            <p>{t('checklistDesc')}</p>

            {allServices.length > 0 ? (
              <>
                <div className="checklist-service-selector">
                  <label htmlFor="checklist-service">
                    {t('selectGovService')}
                  </label>
                  <select
                    id="checklist-service"
                    value={selectedChecklistService}
                    onChange={(event) =>
                      setSelectedChecklistService(event.target.value)
                    }
                  >
                    {allServices.map((item) => (
                      <option key={item.id} value={item.id}>
                          {categoryTitle(item.categoryId, item.categoryName)} - {serviceName(item.serviceName)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedChecklist && (
                  <>
                    <div className="checklist-heading">
                      <div>
                        <h3>{serviceName(selectedChecklist.serviceName)}</h3>
                        <p>{categoryTitle(selectedChecklist.categoryId, selectedChecklist.categoryName)}</p>
                      </div>
                      <Link
                        to={`/category/${selectedChecklist.categoryId}/service/${selectedChecklist.serviceIndex}`}
                        className="account-action-link"
                      >
                        {t('viewServiceDetails')}
                      </Link>
                    </div>

                    {canonicalDocuments.length > 0 ? (
                      <>
                        <div className="checklist-progress">
                          <div className="checklist-progress-info">
                            <span>{t('docPrepProgress')}</span>
                            <strong>
                              {completedDocuments} / {canonicalDocuments.length} {t('completed')}
                            </strong>
                          </div>
                          <div
                            className="checklist-progress-track"
                            role="progressbar"
                            aria-valuemin="0"
                            aria-valuemax={canonicalDocuments.length}
                            aria-valuenow={completedDocuments}
                          >
                            <div
                              className="checklist-progress-fill"
                              style={{
                                width: `${
                                  (completedDocuments / canonicalDocuments.length) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="checklist-document-list">
                          <h3> {t('tabDocuments')}</h3>
                          {canonicalDocuments.map((canonicalDoc, idx) => (
                            <label  
                              className="checklist-document-item"
                              key={canonicalDoc}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  checklistProgress[selectedChecklistService]?.[canonicalDoc]
                                )}
                                onChange={(event) =>
                                  handleChecklistChange(canonicalDoc, event.target.checked)
                                }
                              />
                              <span>{displayedDocuments[idx] || canonicalDoc}</span>
                            </label>
                          ))}
                        </div>

                        {completedDocuments === canonicalDocuments.length && (
                          <p className="checklist-completed-message">
                            {t('allDocsCompleted')}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="account-empty-state">
                        <span>📋</span>
                        <h3>{t('noChecklistTitle')}</h3>
                        <p>{t('noChecklistDesc')}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        );

      case 'My Downloads':
        return (
          <div className="account-section">
            <h2>{t('menuDownloads')}</h2>
            <p>{t('downloadsDesc')}</p>

            {downloadHistory.length === 0 ? (
              <div className="account-empty-state">
                <span>📁</span>
                <h3>{t('noDownloadsTitle')}</h3>
                <p>{t('noDownloadsDesc')}</p>
              </div>
            ) : (
              <div className="downloads-list">
                {downloadHistory.map((item) => (
                  <div className="download-item" key={item.id}>
                    <div>
                      <h4>📄 {item.name}</h4>
                      <p>{t('downloadedOn')} {item.date}</p>
                    </div>
                    {item.docId && (
                      <button
                        type="button"
                        className="settings-link"
                        onClick={() => handleDownloadAgain(item)}
                      >
                        {t('downloadAgain')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Feedback & Reports':
        return (
          <div className="account-section">
            <h2>{t('feedbackTitle')}</h2>
            <p>{t('feedbackSubtitle')}</p>

            <form className="account-form mb-4" onSubmit={handleFeedbackSubmit}>
              <div className="profile-form-group">
                <label htmlFor="fb-type">{t('feedbackType')}</label>
                <select
                  id="fb-type"
                  value={feedbackForm.feedback_type}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, feedback_type: e.target.value }))
                  }
                >
                  <option value="Suggestion">{t('feedbackTypeSuggestion')}</option>
                  <option value="Bug Report">{t('feedbackTypeBug')}</option>
                  <option value="Service Info Correction">{t('feedbackTypeCorrection')}</option>
                  <option value="General Inquiry">{t('feedbackTypeInquiry')}</option>
                </select>
              </div>

              <div className="profile-form-group">
                <label htmlFor="fb-subject">{t('feedbackSubject')}</label>
                <input
                  id="fb-subject"
                  type="text"
                  value={feedbackForm.subject}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="fb-message">{t('feedbackMessage')}</label>
                <textarea
                  id="fb-message"
                  rows={4}
                  value={feedbackForm.message}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="account-action-button"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? t('submittingFeedback') : t('submitFeedback')}
              </button>
            </form>

            <div className="profile-subsection">
              <h3>{t('myFeedbackHistory')}</h3>
            </div>

            {feedbacks.length === 0 ? (
              <p className="text-muted">{t('noFeedbackYet')}</p>
            ) : (
              <div className="saved-services-list">
                {feedbacks.map((fb) => (
                  <div className="saved-service-item" key={fb.id}>
                    <div className="saved-service-info">
                      <h3>
                        {fb.subject}{' '}
                        <span className="badge bg-secondary ms-2" style={{ fontSize: '11px' }}>
                          {feedbackStatusLabel(fb.status)}
                        </span>
                      </h3>
                      <p>
                        {feedbackTypeLabel(fb.feedback_type)} • {fb.message}
                      </p>
                      {fb.admin_response && (
                        <p className="text-primary mb-0">
                          <strong>{t('adminReply')}</strong> {fb.admin_response}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Account Settings':
        return (
          <div className="account-section">
            <h2>{t('menuSettings')}</h2>
            <p>{t('settingsDesc')}</p>

            <div className="settings-item">
              <div>
                <h3>{t('accountInfo')}</h3>
                <p>{t('accountInfoDesc')}</p>
              </div>
              <button
                type="button"
                className="settings-link"
                onClick={() => setActiveSection('Personal Information')}
              >
                {t('manage')}
              </button>
            </div>

            <div className="settings-item">
              <div>
                <h3>{t('changePassword')}</h3>
                <p>{t('changePasswordDesc')}</p>
              </div>
            </div>

            <form className="account-form password-form" onSubmit={handlePasswordSubmit}>
              <div className="account-form-group">
                <label htmlFor="currentPassword">{t('currentPassword')}</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({
                      ...previous,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder={t('currentPassword')}
                  required
                />
              </div>

              <div className="account-form-group">
                <label htmlFor="newPassword">{t('newPassword')}</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({
                      ...previous,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder={t('newPassword')}
                  minLength={8}
                  required
                />
              </div>

              <div className="account-form-group">
                <label htmlFor="confirmPassword">{t('confirmNewPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({
                      ...previous,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder={t('confirmNewPassword')}
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                className="account-action-button"
                disabled={updatingPassword}
              >
                {updatingPassword ? t('updatingPassword') : t('updatePassword')}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="account-container">
      <aside className="account-sidebar">
        <h2>{t('myAccount')}</h2>

        <div className="account-user">
          <div className="account-avatar">👤</div>
          <div>
            <h4>{profile.fullName || t('welcomeUser')}</h4>
            <p>{t('myAccount')}</p>
          </div>
        </div>

        <nav className="account-menu">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`account-menu-item ${
                activeSection === item.key ? 'active' : ''
              }`}
              onClick={() => {
                setStatusNotice(null);
                setActiveSection(item.key);
                setIsEditing(false);
              }}
            >

              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="account-logout"
          onClick={handleLogout}
        >
          <span>↪</span> {t('navLogout')}
        </button>
      </aside>


      <main className="account-main">
        <div className="account-topbar">
          <h2>{activeMenuItem?.label || activeSection}</h2>
          <span>{t('myAccount')}</span>
        </div>

        {statusNotice && (
          <div
            className= {`alert alert-${statusNotice.type === 'danger' ? 'danger' : 'success'} py-2 px-3 mb-3`}
            role="alert"
          >
            {statusNotice.key
              ? t(statusNotice.key)

              : translateMessage(statusNotice.raw, statusNotice.fallbackKey)}
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

export default Profile;
