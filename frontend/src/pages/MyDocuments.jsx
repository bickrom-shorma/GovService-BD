import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest, fetchProtectedBlob } from '../utils/api';
import './MyDocuments.css';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function MyDocuments() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t, language, translateMessage } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('nid');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const docTypeOptions = t('docTypeOptions');

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest('/api/documents');
      setDocuments(data?.documents || []);
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'docsLoadError' });
    } finally {
      setLoadedOnce(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let active = true;
    apiRequest('/api/documents')
      .then((data) => {
        if (active) setDocuments(data?.documents || []);
      })
      .catch((err) => {
        if (active) setError({ raw: err.message, fallbackKey: 'docsLoadError' });
      })
      .finally(() => {
        if (active) setLoadedOnce(true);
      });
    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (previewDoc?.url) {
        URL.revokeObjectURL(previewDoc.url);
      }
    };
  }, [previewDoc]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError(null);
    setSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError({ key: 'docsInvalidType' });
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError({ key: 'docsMaxSize' });
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!docName.trim()) {
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError({ key: 'docsSelectFile' });
      return;
    }

    if (!docName.trim()) {
      setError({ key: 'docsEnterName' });
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('document_name', docName.trim());
    formData.append('document_type', docType);

    setUploading(true);
    try {
      await apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      setSuccess({ key: 'docsUploadSuccess' });
      setDocName('');
      setSelectedFile(null);
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';
      await fetchDocuments();
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'docsUploadError' });
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc) => {
    setError(null);
    try {
      const blob = await fetchProtectedBlob(`/api/documents/${doc.id}/download?inline=1`);
      const url = URL.createObjectURL(blob);
      if (previewDoc?.url) {
        URL.revokeObjectURL(previewDoc.url);
      }
      setPreviewDoc({
        name: doc.document_name,
        mimeType: doc.mime_type || blob.type || '',
        url,
      });
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'docsPreviewError' });
    }
  };

  const handleDownload = async (doc) => {
    setError(null);
    try {
      const blob = await fetchProtectedBlob(`/api/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = doc.document_name || doc.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      const newDownload = {
        id: `${Date.now()}-${Math.random()}`,
        name: doc.document_name || doc.file_name,
        date: new Date().toLocaleString(),
        docId: doc.id,
      };
      localStorage.setItem(
        'downloadHistory',
        JSON.stringify([newDownload, ...history].slice(0, 25))
      );

      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'docsDownloadError' });
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      await apiRequest(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments((previous) => previous.filter((item) => item.id !== id));
      if (previewDoc) {
        URL.revokeObjectURL(previewDoc.url);
        setPreviewDoc(null);
      }
      setSuccess({ key: 'docsDeleteSuccess' });
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'docsDeleteError' });
    }
  };

  if (authLoading) {
    return (
      <div className="my-documents-page text-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="my-documents-page">
        <div className="documents-header">
          <h2>{t('docsTitle')}</h2>
          <p>{t('docsSubtitle')}</p>
        </div>

        <div className="documents-list text-center py-5">
          <p className="mb-4">{t('docsLoginRequired')}</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/login" state={{ from: '/my-documents' }} className="btn btn-primary">
              {t('navLogin')}
            </Link>
            <Link to="/register" className="btn btn-outline-primary">
              {t('navRegister')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-documents-page">
      <div className="documents-header">
        <h2>{t('docsTitle')}</h2>
        <p>{t('docsSubtitle')}</p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3" role="alert">
          {error.key ? t(error.key) : translateMessage(error.raw, error.fallbackKey)}
        </div>
      )}
      {success && (
        <div className="alert alert-success py-2 px-3 mb-3" role="status">
          {success.key ? t(success.key) : translateMessage(success.raw, success.fallbackKey)}
        </div>
      )}

      <form className="document-upload-box" onSubmit={handleUpload}>
        <h3>{t('uploadNewDoc')}</h3>
        <p>{t('supportedFormats')}</p>

        <div className="row g-3 mt-1">
          <div className="col-md-5">
            <label htmlFor="doc-name-input" className="form-label fw-semibold">
              {t('docNameLabel')}
            </label>
            <input
              id="doc-name-input"
              type="text"
              className="form-control mt-0"
              placeholder={t('docNamePlaceholder')}
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label htmlFor="doc-type-select" className="form-label fw-semibold">
              {t('docTypeLabel')}
            </label>
            <select
              id="doc-type-select"
              className="form-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {Object.entries(docTypeOptions).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="doc-file-input" className="form-label fw-semibold">
              {t('chooseFile')}
            </label>
            <input
              id="doc-file-input"
              type="file"
              className="form-control mt-0"
              accept=".pdf,image/*,.doc,.docx"
              onChange={handleFileChange}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-success mt-3"
          disabled={uploading}
        >
          {uploading ? t('uploadingBtn') : t('uploadBtn')}
        </button>
      </form>

      {previewDoc && (
        <div className="documents-list mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">{previewDoc.name}</h4>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              aria-label={t('closeLabel')}
              onClick={() => {
                URL.revokeObjectURL(previewDoc.url);
                setPreviewDoc(null);
              }}
            >
              ✕
            </button>
          </div>
          {previewDoc.mimeType.startsWith('image/') ? (
            <img
              src={previewDoc.url}
              alt={previewDoc.name}
              style={{ maxWidth: '100%', maxHeight: '460px', borderRadius: '8px' }}
            />
          ) : previewDoc.mimeType === 'application/pdf' ? (
            <iframe
              src={previewDoc.url}
              title={previewDoc.name}
              style={{ width: '100%', height: '460px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
          ) : (
            <p className="mb-0 text-muted">
              {t('docsPreviewUnavailable')}
            </p>
          )}
        </div>
      )}

      <div className="documents-list">
        <h3>
          {t('uploadedDocs')} ({documents.length})
        </h3>

        {!loadedOnce ? (
          <p className="empty-documents">{t('loading')}</p>
        ) : documents.length === 0 ? (
          <p className="empty-documents">{t('noDocsYet')}</p>
        ) : (
          documents.map((doc) => (
            <div className="document-item" key={doc.id}>
              <div>
                <h4>{doc.document_name}</h4>
                <p>
                  {docTypeOptions[doc.document_type] || doc.document_type || t('docsFallbackType')}
                  {doc.file_size ? ` • ${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                  {doc.uploaded_at
                    ? ` • ${new Date(doc.uploaded_at).toLocaleDateString(
                        language === 'bn' ? 'bn-BD' : 'en-US'
                      )}`
                    : ''}
                </p>
              </div>

              <div className="document-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success document-view-btn"
                  onClick={() => handleView(doc)}
                >
                  {t('view')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success document-download-btn"
                  onClick={() => handleDownload(doc)}
                >
                  {t('download')}
                </button>
                <button
                  type="button"
                  className="document-delete-btn"
                  onClick={() => handleDelete(doc.id)}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyDocuments;
