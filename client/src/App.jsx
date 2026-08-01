import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import ChildrenList from './components/ChildrenList';
import ChildForm from './components/ChildForm';
import EventsList from './components/EventsList';
import EventForm from './components/EventForm';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function EditChildRoute() {
  const { id } = useParams();

  return <ChildForm childId={id} />;
}

function EditEventRoute() {
  const { id } = useParams();

  return <EventForm eventId={id} />;
}

function AppShell() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <Link to="/">Children</Link>
        <Link to="/add">Add child</Link>
        <Link to="/events">Events</Link>
        <Link to="/add-event">Add event</Link>
        {token ? (
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <ChildrenList />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add"
          element={(
            <ProtectedRoute>
              <ChildForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit/:id"
          element={(
            <ProtectedRoute>
              <EditChildRoute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/events"
          element={(
            <ProtectedRoute>
              <EventsList />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add-event"
          element={(
            <ProtectedRoute>
              <EventForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit-event/:id"
          element={(
            <ProtectedRoute>
              <EditEventRoute />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
