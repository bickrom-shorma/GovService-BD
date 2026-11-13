
import { useState } from 'react';
import './MyDocuments.css';

function MyDocuments() {
  const [documents, setDocuments] = useState([]);

  const handleUpload = (event) => {
    const files = Array.from(event.target.files);

    const validFiles = files.filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.type.startsWith('image/')
    );

    const newDocuments = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: (file.size / 1024).toFixed(2),
      file,
      url: URL.createObjectURL(file),
    }));

    setDocuments((previous) => [...previous, ...newDocuments]);

    event.target.value = '';
  };
  const handleDownload = (document) => {
  const history = JSON.parse(
    localStorage.getItem('downloadHistory') || '[]'
  );

  const newDownload = {
    id: `${Date.now()}-${Math.random()}`,
    name: document.name,
    date: new Date().toLocaleString(),
    url: document.url,
  };

  localStorage.setItem(
    'downloadHistory',
    JSON.stringify([newDownload, ...history])
  );
};

  const handleDelete = (id) => {
    const document = documents.find((item) => item.id === id);

    if (document) {
      URL.revokeObjectURL(document.url);
    }

    setDocuments((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="my-documents-page">
      <div className="documents-header">
        <h2>My Documents</h2>
        <p>Upload and manage your personal documents securely.</p>
      </div>

      <div className="document-upload-box">
        <h3>Upload New Document</h3>
        <p>Supported formats: PDF, JPG, JPEG, PNG</p>

        <input
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={handleUpload}
        />
      </div>

      <div className="documents-list">
        <h3>Uploaded Documents ({documents.length})</h3>

        {documents.length === 0 ? (
          <p className="empty-documents">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((document) => (
            <div className="document-item" key={document.id}>
              <div>
                <h4>{document.name}</h4>
                <p>{document.size} KB</p>
              </div>

              <div className="document-actions">
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
                <a
                 href={document.url}
                 download={document.name}
                 onClick={() => handleDownload(document)}
                >
                  Download
                </a>

                <button onClick={() => handleDelete(document.id)}>
                  Delete
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
