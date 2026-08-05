import { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const CATEGORY_LABELS = {
  school: 'School',
  activity: 'Activity',
  medical: 'Medical',
  family: 'Family',
  announcement: 'Announcement',
};

function CalendarImport() {
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [hasExtracted, setHasExtracted] = useState(false);
  const [events, setEvents] = useState([]);
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState(null);

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

  const handleFileChange = (event) => {
    setFile(event.target.files[0] || null);
    setEvents([]);
    setHasExtracted(false);
    setSaveResults(null);
    setExtractError('');
  };

  const handleExtract = async (event) => {
    event.preventDefault();
    setExtractError('');
    setSaveResults(null);

    if (!file) {
      setExtractError('Please choose an image to extract events from.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setExtracting(true);

    try {
      const response = await axios.post('/api/ai/extract-calendar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const extracted = response.data.map((item) => ({
        localId: crypto.randomUUID(),
        title: item.title ?? '',
        category: item.category ?? '',
        date: item.date ?? '',
        description: item.description ?? '',
        allDay: item.allDay ?? true,
        included: true,
      }));

      setEvents(extracted);
      setHasExtracted(true);
    } catch (err) {
      setExtractError(err.response?.data?.error || 'Unable to extract events from this image.');
    } finally {
      setExtracting(false);
    }
  };

  const toggleIncluded = (localId) => {
    setEvents((current) => current.map((item) => (
      item.localId === localId ? { ...item, included: !item.included } : item
    )));
  };

  const updateEventField = (localId, field, value) => {
    setEvents((current) => current.map((item) => (
      item.localId === localId ? { ...item, [field]: value } : item
    )));
  };

  const handleSave = async () => {
    const selected = events.filter((item) => item.included);

    if (selected.length === 0) {
      setSaveResults({ successCount: 0, total: 0, failures: [] });
      return;
    }

    setSaving(true);
    setSaveResults(null);

    const failures = [];
    let successCount = 0;

    for (let index = 0; index < selected.length; index += 1) {
      const item = selected[index];

      try {
        // Saved one at a time (not Promise.all) so a single bad item can't
        // abort the rest — each success/failure is tracked independently.
        // eslint-disable-next-line no-await-in-loop
        await axios.post('/api/events', {
          title: item.title.trim(),
          category: item.category,
          startDate: item.date,
          description: item.description || '',
          allDay: item.allDay,
          childId: childId || null,
        });
        successCount += 1;
      } catch (err) {
        failures.push({
          localId: item.localId,
          title: item.title,
          error: err.response?.data?.error || 'Unable to save',
        });
      }
    }

    const failedLocalIds = new Set(failures.map((failure) => failure.localId));
    setEvents((current) => current.filter((item) => !item.included || failedLocalIds.has(item.localId)));
    setSaving(false);
    setSaveResults({ successCount, total: selected.length, failures });
  };

  const hasEvents = events.length > 0;
  const hasIncluded = events.some((item) => item.included);

  return (
    <section className="child-form-card">
      <h2>Calendar Import</h2>
      <p className="calendar-import-intro">
        Upload a photo of a school flyer, newsletter, or calendar page and review the events
        AI finds before saving them.
      </p>

      {extractError ? <p className="form-message error">{extractError}</p> : null}

      <form className="child-form" onSubmit={handleExtract}>
        <label>
          Image
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
          />
        </label>

        <button type="submit" disabled={!file || extracting}>
          {extracting ? 'Analyzing...' : 'Extract events'}
        </button>
      </form>

      {extracting && (
        <div className="list-state">Analyzing image... this may take a moment</div>
      )}

      {hasExtracted && !extracting && !hasEvents && (
        <div className="list-state">No events found in this image.</div>
      )}

      {hasExtracted && !extracting && hasEvents && (
        <div className="calendar-import-review">
          <label>
            Assign to child
            <select value={childId} onChange={(event) => setChildId(event.target.value)}>
              <option value="">Family-wide</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </label>

          <ul className="calendar-import-list">
            {events.map((item) => (
              <li key={item.localId} className="calendar-import-row">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => toggleIncluded(item.localId)}
                  aria-label={`Include ${item.title || 'this event'}`}
                />
                <div className="calendar-import-row-fields">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) => updateEventField(item.localId, 'title', event.target.value)}
                  />
                  <span className="category-badge">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(event) => updateEventField(item.localId, 'date', event.target.value)}
                  />
                  {item.description && (
                    <p className="calendar-import-description">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button type="button" onClick={handleSave} disabled={saving || !hasIncluded}>
            {saving ? 'Saving...' : 'Save selected events'}
          </button>

          {saveResults && (
            <div className={`form-message ${saveResults.failures.length > 0 ? 'error' : 'success'}`}>
              <p>
                {saveResults.successCount} of {saveResults.total} events saved successfully.
              </p>
              {saveResults.failures.length > 0 && (
                <ul>
                  {saveResults.failures.map((failure) => (
                    <li key={failure.localId}>
                      {failure.title || 'Untitled'}: {failure.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default CalendarImport;
