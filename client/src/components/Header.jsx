import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function Header() {
  const { token } = useAuth();

  return (
    <header className="app-header">
      <span className="app-header-icon" aria-hidden="true">🚀</span>
      <span className="app-header-title">ParentPilotAI</span>
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
