import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-5">
        <div className="mb-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors mb-5 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-emerald-600 shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-sm text-gray-500">Effective date: June 26, 2026</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-7 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Introduction</h2>
            <p>
              The Climate Note ("we," "our," or "us") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, and safeguard your information when you
              use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Information We Collect</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Email address</strong> — used for account creation and authentication</li>
              <li><strong>Display name</strong> — optional name you choose, shown in community features</li>
              <li><strong>User-generated content</strong> — your climate action notes and goals</li>
              <li><strong>Activity data</strong> — reading streaks, goal progress, and impact classifications</li>
            </ul>
            <p className="mt-3 text-gray-600">
              <strong>We do not collect</strong> device identifiers, advertising IDs, precise location,
              contacts, photos, crash reports, or analytics data. We use no analytics or tracking SDKs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">How We Use Your Information</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>Provide and maintain your account and the app</li>
              <li>Display today's climate article and personalised content</li>
              <li>Enable community features (shared notes, leaderboard)</li>
              <li>Schedule optional local reminders on your device — no data leaves your device for this</li>
              <li>Improve security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Features</h2>
            <p>
              When you use AI-powered features (article insights, action suggestions, impact
              classification), the relevant text is sent to our server and processed by{' '}
              <strong>Google Gemini</strong> (Google LLC). This text is used solely to generate your
              response and is not retained by us or used to train AI models. See{' '}
              <a
                href="https://policies.google.com/privacy"
                className="text-emerald-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google's Privacy Policy
              </a>
              .
            </p>
            <p className="mt-2 text-gray-600">
              Impact figures shown in the app are <strong>modelled estimates</strong>, not verified
              scientific measurements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Information Sharing</h2>
            <p className="mb-2">
              We do not sell, trade, or rent your personal information. We share data only in these
              circumstances:
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Community features</strong> — your display name and action notes are visible
                to other users only when you choose to share them. Your email is never shown publicly.
              </li>
              <li>
                <strong>Supabase</strong> — our database and authentication provider stores your data
                securely.
              </li>
              <li>
                <strong>Google Gemini</strong> — text you submit for AI features is processed
                server-side as described above.
              </li>
              <li>
                <strong>Legal requirements</strong> — when required by law or to protect our rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>Access or correct your personal data</li>
              <li>
                <strong>Delete your account and all data</strong> — go to Profile → Delete account.
                All notes, goals, streak history, and profile data are permanently deleted.
              </li>
              <li>Opt out of local reminders at any time in the app or iOS Settings</li>
            </ul>
            <p className="mt-2">
              For other requests, email{' '}
              <a href="mailto:privacy@theclimatenote.app" className="text-emerald-600 underline">
                privacy@theclimatenote.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Retention</h2>
            <p>
              We retain your data as long as your account is active. When you delete your account,
              all personal data is permanently removed from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Children's Privacy</h2>
            <p>
              The Climate Note is not directed to children under 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              personal information, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes through the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h2>
            <ul className="space-y-1">
              <li>
                Privacy questions:{' '}
                <a href="mailto:privacy@theclimatenote.app" className="text-emerald-600 underline">
                  privacy@theclimatenote.app
                </a>
              </li>
              <li>
                General support:{' '}
                <a href="mailto:support@theclimatenote.app" className="text-emerald-600 underline">
                  support@theclimatenote.app
                </a>
              </li>
            </ul>
          </section>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs">
            Last updated: June 26, 2026
          </div>
        </div>
      </div>
    </div>
  );
}
