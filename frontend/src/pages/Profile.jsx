import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import servicesData from '../data/services';
import serviceDetailsData from '../data/serviceDetailsData';
import './Profile.css';

const readLocalStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

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

const menuItems = [
  { name: 'Overview', icon: '📊' },
  { name: 'Personal Information', icon: '👤' },
  { name: 'Saved Services', icon: '⭐' },
  { name: 'My Document Checklist', icon: '📋' },
  { name: 'My Downloads', icon: '📁' },
  { name: 'Account Settings', icon: '⚙️' },
];

function Profile() {
  const [activeSection, setActiveSection] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState(() => ({
    ...initialProfile,
    ...readLocalStorage('profileInformation', {}),
    presentAddress: {
      ...initialProfile.presentAddress,
      ...(readLocalStorage('profileInformation', {}).presentAddress || {}),
    },
    permanentAddress: {
      ...initialProfile.permanentAddress,
      ...(readLocalStorage('profileInformation', {}).permanentAddress || {}),
    },
  }));

  const [savedServices, setSavedServices] = useState(() =>
    readLocalStorage('savedServices', [])
  );

  const [selectedChecklistService, setSelectedChecklistService] = useState(
    allServices[0]?.id || ''
  );

  const [checklistProgress, setChecklistProgress] = useState(() =>
    readLocalStorage('checklistProgress', {})
  );

  const [downloadHistory] = useState(() =>
    readLocalStorage('downloadHistory', [])
  );

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const selectedChecklist = useMemo(
    () => allServices.find((item) => item.id === selectedChecklistService),
    [selectedChecklistService]
  );

  const checklistDetails = serviceDetailsData[selectedChecklistService];
  const requiredDocuments = checklistDetails?.requiredDocuments || [];

  const completedDocuments = requiredDocuments.filter(
    (document) => checklistProgress[selectedChecklistService]?.[document]
  ).length;

  useEffect(() => {
    const updateSavedServices = () => {
      setSavedServices(readLocalStorage('savedServices', []));
    };

    window.addEventListener('savedServicesUpdated', updateSavedServices);
    window.addEventListener('storage', updateSavedServices);

    return () => {
      window.removeEventListener('savedServicesUpdated', updateSavedServices);
      window.removeEventListener('storage', updateSavedServices);
    };
  }, []);

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

  const handleProfileSave = (event) => {
    event.preventDefault();

    try {
      localStorage.setItem('profileInformation', JSON.stringify(profile));
      setIsEditing(false);
      alert('Profile information saved in this browser. Backend sync is not connected yet.');
    } catch {
      alert('Could not save profile information in this browser.');
    }
  };

  const handleProfileCancel = () => {
    setProfile({
      ...initialProfile,
      ...readLocalStorage('profileInformation', {}),
      presentAddress: {
        ...initialProfile.presentAddress,
        ...(readLocalStorage('profileInformation', {}).presentAddress || {}),
      },
      permanentAddress: {
        ...initialProfile.permanentAddress,
        ...(readLocalStorage('profileInformation', {}).permanentAddress || {}),
      },
    });
    setIsEditing(false);
  };

  const handleChecklistChange = (document, checked) => {
    setChecklistProgress((previous) => {
      const updated = {
        ...previous,
        [selectedChecklistService]: {
          ...previous[selectedChecklistService],
          [document]: checked,
        },
      };

      localStorage.setItem('checklistProgress', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveSavedService = (serviceId) => {
    const updatedServices = savedServices.filter(
      (service) => service.id !== serviceId
    );

    localStorage.setItem('savedServices', JSON.stringify(updatedServices));
    setSavedServices(updatedServices);
    window.dispatchEvent(new Event('savedServicesUpdated'));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    alert('Password change is not connected to the backend yet.');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Overview':
        return (
          <div className="account-overview">
            <h2>Welcome to My Account</h2>
            <p>
              Manage your government services and personal information from
              one place.
            </p>

            <div className="overview-profile-card">
              <div className="overview-avatar">👤</div>
              <div>
                <h3>{profile.fullName || 'Welcome User'}</h3>
                <p>{profile.email || 'Your email address'}</p>
              </div>
            </div>

            <div className="overview-cards">
              {menuItems.slice(1).map((item) => (
                <button
                  type="button"
                  className="overview-card"
                  key={item.name}
                  onClick={() => setActiveSection(item.name)}
                >
                  <span>{item.icon}</span>
                  <h3>{item.name}</h3>
                  <p>View and manage your {item.name.toLowerCase()}.</p>
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
                <h2>Personal Information</h2>
                <p>Manage your personal details and address information.</p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="account-action-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form className="profile-form" onSubmit={handleProfileSave}>
              <div className="profile-subsection">
                <h3>Personal Details</h3>
                <p>Your basic personal information.</p>
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="phone">Mobile Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="nidNumber">NID Number</label>
                  <input
                    id="nidNumber"
                    name="nidNumber"
                    value={profile.nidNumber}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter NID number"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
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
                  <label htmlFor="fatherName">Father's Name</label>
                  <input
                    id="fatherName"
                    name="fatherName"
                    value={profile.fatherName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter father's name"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="motherName">Mother's Name</label>
                  <input
                    id="motherName"
                    name="motherName"
                    value={profile.motherName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter mother's name"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={profile.gender}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="maritalStatus">Marital Status</label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={profile.maritalStatus}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    id="occupation"
                    name="occupation"
                    value={profile.occupation}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter your occupation"
                  />
                </div>
              </div>

              <div className="profile-subsection">
                <h3>Address Information</h3>
                <p>Provide your present and permanent address.</p>
              </div>

              {['presentAddress', 'permanentAddress'].map((type) => (
                <div className="profile-address-card" key={type}>
                  <h3>
                    {type === 'presentAddress'
                      ? 'Present Address'
                      : 'Permanent Address'}
                  </h3>

                  <div className="profile-form-grid">
                    {[
                      ['division', 'Division'],
                      ['district', 'District'],
                      ['upazila', 'Upazila'],
                      ['union', 'Union / Municipality'],
                      ['village', 'Village / Road / House'],
                    ].map(([field, label]) => (
                      <div className="profile-form-group" key={field}>
                        <label htmlFor={`${type}-${field}`}>{label}</label>
                        <input
                          id={`${type}-${field}`}
                          name={`${type}.${field}`}
                          value={profile[type][field]}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          placeholder={`Enter ${label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isEditing && (
                <div className="profile-form-actions">
                  <button type="submit" className="account-action-button">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleProfileCancel}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        );

      case 'Saved Services':
        return (
          <div className="account-section">
            <h2>Saved Services</h2>
            <p>Manage your important government services.</p>

            {savedServices.length === 0 ? (
              <div className="account-empty-state">
                <span>⭐</span>
                <h3>No Saved Services Yet</h3>
                <p>Your saved government services will appear here.</p>
                <Link to="/" className="account-action-link">
                  Explore Services
                </Link>
              </div>
            ) : (
              <div className="saved-services-list">
                {savedServices.map((item) => (
                  <div className="saved-service-item" key={item.id}>
                    <div className="saved-service-info">
                      <h3>⭐ {item.serviceName}</h3>
                      <p>{item.categoryName}</p>
                      <Link
                        to={`/category/${item.categoryId}/service/${item.serviceIndex}`}
                        className="account-action-link"
                      >
                        View Details
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSavedService(item.id)}
                    >
                      Remove
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
            <h2>My Document Checklist</h2>
            <p>
              Select a government service and track your required document
              preparation.
            </p>

            {allServices.length > 0 ? (
              <>
                <div className="checklist-service-selector">
                  <label htmlFor="checklist-service">
                    Select Government Service
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
                        {item.categoryName} - {item.serviceName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedChecklist && (
                  <>
                    <div className="checklist-heading">
                      <div>
                        <h3>{selectedChecklist.serviceName}</h3>
                        <p>{selectedChecklist.categoryName}</p>
                      </div>
                      <Link
                        to={`/category/${selectedChecklist.categoryId}/service/${selectedChecklist.serviceIndex}`}
                        className="account-action-link"
                      >
                        View Service Details
                      </Link>
                    </div>

                    {requiredDocuments.length > 0 ? (
                      <>
                        <div className="checklist-progress">
                          <div className="checklist-progress-info">
                            <span>Document Preparation Progress</span>
                            <strong>
                              {completedDocuments} / {requiredDocuments.length}{' '}
                              Completed
                            </strong>
                          </div>
                          <div
                            className="checklist-progress-track"
                            role="progressbar"
                            aria-valuemin="0"
                            aria-valuemax={requiredDocuments.length}
                            aria-valuenow={completedDocuments}
                          >
                            <div
                              className="checklist-progress-fill"
                              style={{
                                width: `${
                                  (completedDocuments /
                                    requiredDocuments.length) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="checklist-document-list">
                          <h3>Required Documents</h3>
                          {requiredDocuments.map((document) => (
                            <label
                              className="checklist-document-item"
                              key={document}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  checklistProgress[selectedChecklistService]?.[
                                    document
                                  ]
                                )}
                                onChange={(event) =>
                                  handleChecklistChange(
                                    document,
                                    event.target.checked
                                  )
                                }
                              />
                              <span>{document}</span>
                            </label>
                          ))}
                        </div>

                        {completedDocuments === requiredDocuments.length && (
                          <p className="checklist-completed-message">
                            ✓ All required documents are marked as completed!
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="account-empty-state">
                        <span>📋</span>
                        <h3>No Checklist Available</h3>
                        <p>
                          Required document information is not available for
                          this service yet.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="account-empty-state">
                <span>📋</span>
                <h3>No Services Available</h3>
                <p>There are no services to show in the checklist yet.</p>
              </div>
            )}
          </div>
        );

      case 'My Downloads':
        return (
          <div className="account-section">
            <h2>My Downloads</h2>
            <p>Access your downloaded documents and files.</p>

            {downloadHistory.length === 0 ? (
              <div className="account-empty-state">
                <span>📁</span>
                <h3>No Downloads Yet</h3>
                <p>Your downloaded documents will appear here.</p>
              </div>
            ) : (
              <div className="downloads-list">
                {downloadHistory.map((item) => (
                  <div className="download-item" key={item.id}>
                    <div>
                      <h4>📄 {item.name}</h4>
                      <p>Downloaded: {item.date}</p>
                    </div>
                    <a href={item.url} download={item.name}>
                      Download Again
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Account Settings':
        return (
          <div className="account-section">
            <h2>Account Settings</h2>
            <p>Manage your account preferences and security settings.</p>

            <div className="settings-item">
              <div>
                <h3>Account Information</h3>
                <p>Manage your personal account information.</p>
              </div>
              <button
                type="button"
                className="settings-link"
                onClick={() => setActiveSection('Personal Information')}
              >
                Manage
              </button>
            </div>

            <div className="settings-item">
              <div>
                <h3>Change Password</h3>
                <p>Update your account password for better security.</p>
              </div>
            </div>

            <form className="account-form password-form" onSubmit={handlePasswordSubmit}>
              <div className="account-form-group">
                <label htmlFor="currentPassword">Current Password</label>
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
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="account-form-group">
                <label htmlFor="newPassword">New Password</label>
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
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="account-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
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
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="account-action-button">
                Update Password
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
        <h2>My Account</h2>

        <div className="account-user">
          <div className="account-avatar">👤</div>
          <div>
            <h4>{profile.fullName || 'Welcome User'}</h4>
            <p>My Account</p>
          </div>
        </div>

        <nav className="account-menu">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`account-menu-item ${
                activeSection === item.name ? 'active' : ''
              }`}
              onClick={() => {
                setActiveSection(item.name);
                setIsEditing(false);
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <Link to="/login" className="account-logout">
          <span>↪</span> Logout
        </Link>
      </aside>

      <main className="account-main">
        <div className="account-topbar">
          <h2>{activeSection}</h2>
          <span>My Account</span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

export default Profile;
