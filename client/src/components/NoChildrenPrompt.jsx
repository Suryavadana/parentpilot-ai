import { Link } from 'react-router-dom';
import '../App.css';

function NoChildrenPrompt() {
  return (
    <div className="no-children-prompt">
      <span className="no-children-icon" aria-hidden="true">🧒</span>
      <h2>Let&apos;s add your first child to get started!</h2>
      <p className="no-children-subtitle">
        Once you add a child, you&apos;ll be able to track their homework, fees, calendar and events here.
      </p>
      <Link to="/add" className="no-children-button">Add a child</Link>
    </div>
  );
}

export default NoChildrenPrompt;
