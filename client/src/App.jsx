import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import './App.css';
import ChildrenList from './components/ChildrenList';
import ChildForm from './components/ChildForm';

function EditChildRoute() {
  const { id } = useParams();

  return <ChildForm childId={id} />;
}

function App() {
  return (
    <BrowserRouter>
      <main className="app-shell">
        <nav className="top-nav">
          <Link to="/">Children</Link>
          <Link to="/add">Add child</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ChildrenList />} />
          <Route path="/add" element={<ChildForm />} />
          <Route path="/edit/:id" element={<EditChildRoute />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
