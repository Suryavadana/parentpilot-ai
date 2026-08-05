import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useChild } from '../context/ChildContext';
import '../App.css';

const CATEGORY_LABELS = {
  medical: 'Medical',
  identification: 'Identification',
  school: 'School',
  insurance: 'Insurance',
  other: 'Other',
};

const emptyUploadForm = {
  category: '',
  childId: '',
};

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
});

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extractFileName = (headers, fallback) => {
  const disposition = headers?.['content-disposition'];
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);

  const quotedMatch = disposition.match(/filename="([^"]+)"/i);
  if (quotedMatch) return quotedMatch[1];

  return fallback;
};

function DocumentVault() {
  const { selectedChildId } = useChild();
  const [documents, setDocuments] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);

    try {
      const response = await axios.get('/api/documents', {
        params: selectedChildId ? { childId: selectedChildId } : {},
      });
      setDocuments(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load documents right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('/api/children');
        setChildren(response.data);
      } catch (err) {
        // Child dropdown is optional; leave it empty if it fails to load.
      }
    };

    fetchChildren();
  }, []);

  const openUploadForm = () => {
    setUploadForm(emptyUploadForm);
    setFile(null);
    setUploadError('');
    setShowForm(true);
  };

  const closeUploadForm = () => {
    setShowForm(false);
    setUploadForm(emptyUploadForm);
    setFile(null);
    setUploadError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setUploadForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0] || null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setUploadError('');

    if (!file) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    if (!uploadForm.category) {
      setUploadError('Category is required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadForm.category);
    if (uploadForm.childId) {
      formData.append('childId', uploadForm.childId);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await axios.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      closeUploadForm();
      fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Unable to upload this document.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob',
      });

      const fileName = extractFileName(response.headers, doc.fileName);
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Unable to download this document right now.');
    }
  };

  const handleDelete = async (id, fileName) => {
    const confirmed = window.confirm(`Delete "${fileName}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this document right now.');
    }
  };

  if (loading) {
    return <div className="list-state">Loading documents...</div>;
  }

  if (error) {
    return <div className="list-state error">{error}</div>;
  }

  const hasDocuments = documents.length > 0;

  return (
    <section className="events-list">
      <div className="section-header">
        <h2>Document Vault</h2>
        {hasDocuments && (
          <button
            type="button"
            className="toggle-form-button"
            onClick={showForm ? closeUploadForm : openUploadForm}
          >
            {showForm ? 'Cancel' : 'Upload document'}
          </button>
        )}
      </div>

      {(showForm || !hasDocuments) && (
        <section className="child-form-card">
          <h2>Upload document</h2>

          {uploadError ? <p className="form-message error">{uploadError}</p> : null}

          <form className="child-form" onSubmit={handleUpload}>
            <label>
              File
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={uploadForm.category}
                onChange={handleFormChange}
                required
              >
                <option value="">Select a category</option>
                <option value="medical">Medical</option>
                <option value="identification">Identification</option>
                <option value="school">School</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Child
              <select
                name="childId"
                value={uploadForm.childId}
                onChange={handleFormChange}
              >
                <option value="">Family-wide</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.fullName}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={uploading}>
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload document'}
            </button>

            {uploading && (
              <div className="upload-progress-track">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </form>
        </section>
      )}

      {hasDocuments ? (
        <div className="panel-list">
          {documents.map((doc) => (
            <article key={doc.id} className="event-card">
              <h3>{doc.fileName}</h3>
              <span className="category-badge">{CATEGORY_LABELS[doc.category] || doc.category}</span>
              <p>
                {formatFileSize(doc.sizeBytes)}
                {' · Uploaded '}
                {formatDate(doc.createdAt)}
              </p>
              {doc.childId ? (
                <span className="child-tag">{doc.child?.fullName}</span>
              ) : (
                <span className="child-tag">Family document</span>
              )}
              <div className="card-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => handleDownload(doc)}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list-state">No documents yet</div>
      )}
    </section>
  );
}

export default DocumentVault;
