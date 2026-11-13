
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import servicesData from '../data/services';
import serviceDetailsData from '../data/serviceDetailsData';

import './Profile.css';

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
  const [activeSection, setActiveSection] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [savedServices, setSavedServices] = useState(() => {
  return JSON.parse(localStorage.getItem('savedServices') || '[]');
});

useEffect(() => {
  const updateSavedServices = () => {
    setSavedServices(
      JSON.parse(localStorage.getItem('savedServices') || '[]')
    );
  };

  window.addEventListener('savedServicesUpdated', updateSavedServices);

  return () => {
    window.removeEventListener('savedServicesUpdated', updateSavedServices);
  };
}, []);

const [feedback, setFeedback] = useState({
  type: '',
  subject: '',
  message: '',
});

// Document Checklist States
const [selectedChecklistService, setSelectedChecklistService] = useState(
  allServices[0]?.id || ''
);

const [checklistProgress, setChecklistProgress] = useState(() => {
  return JSON.parse(
    localStorage.getItem('checklistProgress') || '{}'
  );
});

const selectedChecklist = allServices.find(
  (item) => item.id === selectedChecklistService
);

const checklistDetails = serviceDetailsData[selectedChecklistService];

const requiredDocuments = checklistDetails?.requiredDocuments || [];

const completedDocuments = requiredDocuments.filter(
  (document) => checklistProgress[selectedChecklistService]?.[document]
).length;

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


  const menuItems = [
    { name: 'Overview', icon: '📊' },
    { name: 'Personal Information', icon: '👤' },
    { name: 'Saved Services', icon: '⭐' },
    { name: 'My Document Checklist', icon: '📋' },
    { name: 'My Downloads', icon: '📁' },
    { name: 'My Feedback & Reports', icon: '💬' },
    { name: 'Account Settings', icon: '⚙️' },
  ];

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Profile information updated successfully!');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Overview':
        return (
          <div className="account-overview">
            <h2>Welcome to My Account</h2>
            <p>
              Manage your government services and personal information
              from one place.
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
                  className="overview-card"
                  key={item.name}
                  onClick={() => setActiveSection(item.name)}
                >
                  <span>{item.icon}</span>
                  <h3>{item.name}</h3>
                  <p>
                    View and manage your {item.name.toLowerCase()}.
                  </p>
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
                <p>View and update your personal information.</p>
              </div>

              {!isEditing && (
                <button
                  className="account-action-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form
              className="profile-form"
              onSubmit={handleProfileSubmit}
            >
              <div className="profile-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter your phone number"
                  disabled={!isEditing}
                />
              </div>

              <div className="profile-form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="4"
                  value={profile.address}
                  onChange={handleProfileChange}
                  placeholder="Enter your address"
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="profile-form-actions">
                  <button type="submit" className="account-action-button">
                    Save Changes
                  </button>

                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={() => setIsEditing(false)}
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
          <p>
            Your saved government services will appear here.
          </p>
          <Link to="/" className="account-action-link">
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="saved-services-list">
          {savedServices.map((item) => (
            <div className="saved-service-item" key={item.id}>
              <div>
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
                onClick={() => {
                  const updatedServices = savedServices.filter(
                    (service) => service.id !== item.id
                  );

                  localStorage.setItem(
                    'savedServices',
                    JSON.stringify(updatedServices)
                  );

                  setSavedServices(updatedServices);

                  window.dispatchEvent(
                    new Event('savedServicesUpdated')
                  );
                }}
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
        Select a government service and track your required document preparation.
      </p>

      <div className="checklist-service-selector">
        <label htmlFor="checklist-service">
          Select Government Service
        </label>

        <select
          id="checklist-service"
          value={selectedChecklistService}
          onChange={(e) => setSelectedChecklistService(e.target.value)}
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
                    {completedDocuments} / {requiredDocuments.length} Completed
                  </strong>
                </div>

                <div className="checklist-progress-track">
                  <div
                    className="checklist-progress-fill"
                    style={{
                      width: `${
                        (completedDocuments / requiredDocuments.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="checklist-document-list">
                <h3>Required Documents</h3>

                {requiredDocuments.map((document, index) => (
                  <label
                    className="checklist-document-item"
                    key={index}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        checklistProgress[selectedChecklistService]?.[document]
                      )}
                      onChange={(e) =>
                        handleChecklistChange(document, e.target.checked)
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
                Required document information is not available for this service yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

     
case 'My Downloads': {
  const downloadHistory = JSON.parse(
    localStorage.getItem('downloadHistory') || '[]'
  );

  return (
    <div className="account-section">
      <h2>My Downloads</h2>
      <p>Access your downloaded documents and files.</p>

      {downloadHistory.length === 0 ? (
        <div className="account-empty-state">
          <span>📁</span>
          <h3>No Downloads Yet</h3>
          <p>
            Your downloaded documents will appear here.
          </p>
        </div>
      ) : (
        <div className="downloads-list">
          {downloadHistory.map((item) => (
            <div className="download-item" key={item.id}>
              <div>
                <h4>📄 {item.name}</h4>
                <p>
                  Downloaded: {item.date}
                </p>
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
}


      
case 'My Feedback & Reports': {
  const feedbackHistory = JSON.parse(
    localStorage.getItem('feedbackHistory') || '[]'
  );

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();

    const newFeedback = {
      id: `${Date.now()}`,
      type: feedback.type,
      subject: feedback.subject,
      message: feedback.message,
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [
      newFeedback,
      ...feedbackHistory,
    ];

    localStorage.setItem(
      'feedbackHistory',
      JSON.stringify(updatedHistory)
    );

    setFeedback({
      type: '',
      subject: '',
      message: '',
    });

    alert('Your feedback has been submitted successfully!');
  };

  return (
    <div className="account-section">
      <h2>My Feedback & Reports</h2>
      <p>Share your feedback or report a problem.</p>

      <form
        className="feedback-form"
        onSubmit={handleFeedbackSubmit}
      >
        <label>Feedback Type</label>
        <select
          value={feedback.type}
          onChange={(e) =>
            setFeedback({ ...feedback, type: e.target.value })
          }
          required
        >
          <option value="">Select a type</option>
          <option value="feedback">General Feedback</option>
          <option value="suggestion">Suggestion</option>
          <option value="report">Report a Problem</option>
        </select>

        <label>Subject</label>
        <input
          type="text"
          value={feedback.subject}
          onChange={(e) =>
            setFeedback({ ...feedback, subject: e.target.value })
          }
          placeholder="Enter subject"
          required
        />

        <label>Message</label>
        <textarea
          rows="5"
          value={feedback.message}
          onChange={(e) =>
            setFeedback({ ...feedback, message: e.target.value })
          }
          placeholder="Write your feedback or report..."
          required
        />

        <button type="submit" className="account-action-button">
          Submit Feedback
        </button>
      </form>

      <div className="feedback-history">
        <h3>My Submitted Feedback</h3>

        {feedbackHistory.length === 0 ? (
          <div className="account-empty-state">
            <span>📝</span>
            <h3>No Feedback Submitted Yet</h3>
            <p>Your submitted feedback and reports will appear here.</p>
          </div>
        ) : (
          feedbackHistory.map((item) => (
            <div className="feedback-history-item" key={item.id}>
              <h4>{item.subject}</h4>
              <p>
                **Type:** {item.type}
              </p>
              <p>{item.message}</p>
              <small>{item.date}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

     
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

      <form
        className="feedback-form password-form"
        onSubmit={(e) => {
          e.preventDefault();
          alert('Password change will be connected with backend later.');
          e.target.reset();
        }}
      >
        <label>Current Password</label>
        <input
          type="password"
          placeholder="Enter current password"
          required
        />

        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          minLength="6"
          required
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          minLength="6"
          required
        />

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
              key={item.name}
              className={`account-menu-item ${
                activeSection === item.name ? 'active' : ''
              }`}
              onClick={() => setActiveSection(item.name)}
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
