import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import './App.css';
import ChildrenList from './components/ChildrenList';
import ChildForm from './components/ChildForm';
import EventsList from './components/EventsList';
import EventForm from './components/EventForm';

function EditChildRoute() {
  const { id } = useParams();

  return <ChildForm childId={id} />;
}

function EditEventRoute() {
  const { id } = useParams();

  return <EventForm eventId={id} />;
}

function App() {
  return (
    <BrowserRouter>
      <main className="app-shell">
        <nav className="top-nav">
          <Link to="/">Children</Link>
          <Link to="/add">Add child</Link>
          <Link to="/events">Events</Link>
          <Link to="/add-event">Add event</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ChildrenList />} />
          <Route path="/add" element={<ChildForm />} />
          <Route path="/edit/:id" element={<EditChildRoute />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/add-event" element={<EventForm />} />
          <Route path="/edit-event/:id" element={<EditEventRoute />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
