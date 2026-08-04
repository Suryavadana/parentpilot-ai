import Sidebar from './Sidebar';
import '../App.css';

function AppLayout({ children }) {
  return (
    <div className="app-body">
      <Sidebar />
      <main className="app-content">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
