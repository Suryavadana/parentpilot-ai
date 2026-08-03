import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import './App.css';
import ChildrenList from './components/ChildrenList';
import ChildForm from './components/ChildForm';
import EventsList from './components/EventsList';
import EventForm from './components/EventForm';
import HomeworkList from './components/HomeworkList';
import HomeworkForm from './components/HomeworkForm';
import FeesList from './components/FeesList';
import FeeForm from './components/FeeForm';
import DailyScheduleGrid from './components/DailyScheduleGrid';
import AnnouncementsPanel from './components/AnnouncementsPanel';
import ActivitiesPanel from './components/ActivitiesPanel';
import ChildProfile from './components/ChildProfile';
import Header from './components/Header';
import AppLayout from './components/AppLayout';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import InvitePage from './components/InvitePage';
import JoinPage from './components/JoinPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ChildProvider } from './context/ChildContext';

function EditChildRoute() {
  const { id } = useParams();

  return <ChildForm childId={id} />;
}

function EditEventRoute() {
  const { id } = useParams();

  return <EventForm eventId={id} />;
}

function EditHomeworkRoute() {
  const { id } = useParams();

  return <HomeworkForm homeworkId={id} />;
}

function EditFeeRoute() {
  const { id } = useParams();

  return <FeeForm feeId={id} />;
}

function AppShell() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<main className="app-shell"><LoginForm /></main>} />
        <Route path="/signup" element={<main className="app-shell"><SignupForm /></main>} />
        <Route path="/join" element={<main className="app-shell"><JoinPage /></main>} />
        <Route
          path="/invite"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <InvitePage />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <ChildrenList />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <ChildForm />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit/:id"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EditChildRoute />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/children/:id"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <ChildProfile />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/events"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EventsList />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add-event"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EventForm />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit-event/:id"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EditEventRoute />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/homework"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <HomeworkList />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add-homework"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <HomeworkForm />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit-homework/:id"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EditHomeworkRoute />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/fees"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <FeesList />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add-fee"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <FeeForm />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit-fee/:id"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <EditFeeRoute />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/calendar"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <DailyScheduleGrid />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/announcements"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <AnnouncementsPanel />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/activities"
          element={(
            <ProtectedRoute>
              <AppLayout>
                <ActivitiesPanel />
              </AppLayout>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildProvider>
          <AppShell />
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
