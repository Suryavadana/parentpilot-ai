import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

function Header() {
  const { token, user } = useAuth();

  return (
    <header className="app-header">
      <span className="app-header-icon" aria-hidden="true">🚀</span>
      <span className="app-header-title">ParentPilotAI</span>
      {user && (
        <span className="app-header-welcome">Welcome, {capitalize(user.role)}</span>
      )}
      {!token && (
        <nav className="app-header-nav">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </nav>
      )}
    </header>
  );
}

export default Header;
