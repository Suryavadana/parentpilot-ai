import { Link } from 'react-router-dom';
import '../App.css';

// Update this string by hand whenever the policy content actually changes —
// it's a "last updated" date, not today's date, so it must not be derived
// from `new Date()` at render time.
const LAST_UPDATED = 'August 6, 2026';

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-draft-banner" role="alert">
        ⚠️ Placeholder Document — This is a draft privacy policy for a
        personal learning/portfolio project, currently in development and
        testing. It has not been reviewed by a lawyer and should not be
        relied upon for a real app store submission or public launch. It
        will be replaced with a reviewed, finalized policy before any real
        release.
      </div>

      <article className="legal-card">
        <Link to="/" className="legal-back-link">← Back to ParentPilotAI</Link>

        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <section className="legal-section">
          <h2>Introduction</h2>
          <p>
            ParentPilotAI (&quot;the app&quot;, &quot;we&quot;, &quot;us&quot;) helps parents and
            caregivers organize their family&apos;s school, health, and daily life
            information in one place. This policy explains what information we
            collect, how we use it, and the choices you have.
          </p>
        </section>

        <section className="legal-section">
          <h2>What We Collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> your name, email address, and a
              hashed password. We never store your password in plaintext.
            </li>
            <li>
              <strong>Family and child profile data:</strong> child name, date of
              birth, school and grade, allergies, medical conditions, and blood
              group.
            </li>
            <li>
              <strong>Activity data you enter:</strong> homework, fees, calendar
              events, appointments, medications, vaccinations, growth records, and
              feedback notes.
            </li>
            <li>
              <strong>Uploaded documents:</strong> files you add to the Document
              Vault, stored encrypted at rest.
            </li>
            <li>
              <strong>Images you upload:</strong> for the AI calendar import
              feature, used to extract events from a photo (e.g. a school
              newsletter or flyer).
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>How We Use It</h2>
          <p>
            We use your data solely to provide the app&apos;s features to your
            family and the members you invite. We never sell your data, and we
            never use it for advertising.
          </p>
        </section>

        <section className="legal-section">
          <h2>Third-Party Services</h2>
          <ul>
            <li>
              <strong>Google Gemini AI</strong> processes the images and messages
              you send to the AI Assistant and the photo calendar import feature,
              in order to generate responses and extract events. See{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </a>{' '}
              for how Google handles this data.
            </li>
            <li>
              <strong>Hosting providers</strong> (our database and server hosts)
              store your data securely on our behalf.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Data Security</h2>
          <ul>
            <li>Passwords are hashed with bcrypt — never stored in plaintext.</li>
            <li>Documents are encrypted at rest with AES-256-GCM.</li>
            <li>
              All family data is scoped so that only members you&apos;ve invited
              into your family can access it.
            </li>
            <li>
              Role-based permissions limit what caregivers can see — for example,
              caregivers do not have access to financial or document data.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Children&apos;s Data</h2>
          <p>
            This app is intended for use <strong>by</strong> parents and guardians{' '}
            <strong>about</strong> their children — it is not intended for direct
            use by children themselves. We do not knowingly collect data directly
            from children under 13.
          </p>
        </section>

        <section className="legal-section">
          <h2>Your Rights</h2>
          <p>
            You can view your data at any time through the app. You can delete
            your account and its associated data at any time from{' '}
            <Link to="/settings">Account Settings</Link>. If you are the last
            remaining member of your family, deleting your account also
            permanently deletes all family data.
          </p>
        </section>

        <section className="legal-section">
          <h2>Data Retention</h2>
          <p>
            We retain your data for as long as your account is active, and delete
            it upon account deletion as described above.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to This Policy</h2>
          <p>
            If this policy changes, we&apos;ll update the &quot;Last updated&quot;
            date at the top of this page.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            For privacy questions, contact{' '}
            <span className="legal-placeholder">
              privacy@example.com (placeholder — replace before launch)
            </span>
            .
          </p>
        </section>
      </article>
    </div>
  );
}

export default PrivacyPolicy;
