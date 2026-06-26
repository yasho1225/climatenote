import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
            <FileText className="w-7 h-7 text-emerald-600 shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-sm text-gray-500">Effective date: June 26, 2026</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-7 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Agreement to Terms</h2>
            <p>
              By downloading or using The Climate Note ("App"), you agree to these Terms of Service.
              If you do not agree, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description of Service</h2>
            <p className="mb-2">The Climate Note provides:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Daily environmental and climate articles</li>
              <li>Personal climate action note-taking</li>
              <li>Community features — share notes, view others' actions</li>
              <li>Streak tracking, goals, and impact estimates</li>
              <li>Optional local reminders scheduled entirely on your device</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eligibility</h2>
            <p>
              You must be at least <strong>13 years old</strong> to use The Climate Note. By using
              the App you confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">User Accounts</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>You must provide a valid email address to create an account</li>
              <li>You are responsible for the security of your account credentials</li>
              <li>You may not create multiple accounts to manipulate features such as the leaderboard</li>
              <li>Notify us immediately if you suspect unauthorised access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">User Content</h2>
            <p className="mb-2">
              You retain ownership of the notes and content you create. By sharing content in the
              Community feed, you grant us a licence to display and distribute it within the App.
            </p>
            <p className="mb-2 font-medium">You may not post content that:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Is illegal, harmful, or violates others' rights</li>
              <li>Contains hate speech, harassment, or discrimination</li>
              <li>Is spam, misleading, or fraudulent</li>
              <li>Infringes intellectual property rights</li>
              <li>Shares personal information of others without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Content Moderation & Reporting</h2>
            <p>
              To report a note: go to the <strong>Community</strong> tab → tap a note → tap{' '}
              <strong>Report</strong>. We review reports within 24–48 hours and may remove content
              or restrict accounts that violate these Terms.
            </p>
            <p className="mt-2">
              You can hide notes from any user by tapping the note and selecting{' '}
              <strong>Hide posts from this user</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Privacy</h2>
            <p>
              Your use of the App is subject to our Privacy Policy, which is accessible in the App
              (Profile → Privacy Policy) and explains how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Features</h2>
            <p>
              Article insights, action suggestions, and impact classifications are powered by Google
              Gemini. Impact estimates are modelled approximations, not verified scientific
              measurements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Intellectual Property</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>The Climate Note name, logo, and app content are our property</li>
              <li>You may not copy, modify, or redistribute our content without permission</li>
              <li>
                We grant you a limited, non-exclusive, non-transferable licence to use the App for
                personal, non-commercial purposes
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Disclaimers & Limitation of Liability</h2>
            <p className="mb-2">
              The App is provided "as is" without warranties of any kind. We do not guarantee
              uninterrupted or error-free service.
            </p>
            <p>
              To the maximum extent permitted by law, we are not liable for any indirect, incidental,
              or consequential damages arising from your use of the App. Our total liability shall
              not exceed the amount you paid to use the App in the past 12 months (currently $0).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Termination</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                You may delete your account at any time: <strong>Profile → Delete account</strong>.
                All your data is permanently removed.
              </li>
              <li>We may suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to Terms</h2>
            <p>
              We may update these Terms periodically. We will notify you of significant changes
              through the App. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Governing Law</h2>
            <p>
              These Terms are governed by applicable law, without regard to conflict of law
              principles. Any disputes shall be resolved by binding arbitration except where
              prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
            <ul className="space-y-1">
              <li>
                General &amp; legal:{' '}
                <a href="mailto:support@theclimatenote.app" className="text-emerald-600 underline">
                  support@theclimatenote.app
                </a>
              </li>
              <li>
                Privacy rights:{' '}
                <a href="mailto:privacy@theclimatenote.app" className="text-emerald-600 underline">
                  privacy@theclimatenote.app
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
