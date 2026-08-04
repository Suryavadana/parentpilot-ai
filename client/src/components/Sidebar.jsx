import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChild } from '../context/ChildContext';
import '../App.css';

function Sidebar() {
  const { token, logout } = useAuth();
  const { children, selectedChildId, setSelectedChildId } = useChild();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-heading">Today</h3>
        <nav className="sidebar-links">
          <Link to="/today">Today</Link>
        </nav>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Children</h3>
        <nav className="sidebar-links">
          <Link to="/">Children</Link>
        </nav>

        {children.length > 1 && (
          <div className="sidebar-child-selector">
            <label className="sidebar-select-label" htmlFor="sidebar-child-select">Viewing</label>
            <select
              id="sidebar-child-select"
              className="sidebar-child-select"
              value={selectedChildId || ''}
              onChange={(event) => setSelectedChildId(event.target.value)}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">School</h3>
        <nav className="sidebar-links">
          <Link to="/calendar">Calendar</Link>
          <Link to="/homework">Homework</Link>
          <Link to="/fees">Fees</Link>
          <Link to="/announcements">Announcements</Link>
        </nav>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Activities</h3>
        <nav className="sidebar-links">
          <Link to="/activities">Activities</Link>
        </nav>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Events</h3>
        <nav className="sidebar-links">
          <Link to="/events">Events</Link>
        </nav>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Health</h3>
        <nav className="sidebar-links">
          <Link to="/medications">Medications</Link>
          <Link to="/doctors">Doctors</Link>
          <Link to="/appointments">Appointments</Link>
          <Link to="/vaccinations">Vaccinations</Link>
          <Link to="/growth-records">Growth Records</Link>
          <Link to="/feedback">Feedback</Link>
        </nav>
      </div>

      {token && (
        <div className="sidebar-footer">
          <Link to="/invite">Invite</Link>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
