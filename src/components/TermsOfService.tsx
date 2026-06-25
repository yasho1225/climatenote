import React from 'react';
import { ArrowLeft, FileText, Users, Shield, AlertTriangle, Scale } from 'lucide-react';

export default function TermsOfService() {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600">Last updated: March 22, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4">
              <Scale className="w-6 h-6 text-emerald-600" />
              <span>Agreement to Terms</span>
            </h2>
            <p>
              By accessing and using The Climate Note ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <FileText className="w-6 h-6 text-emerald-600" />
              <span>Description of Service</span>
            </h2>
            <p>
              The Climate Note is an environmental newsletter platform that provides:
            </p>
            <ul className="space-y-2">
              <li>Daily environmental articles and insights</li>
              <li>Personal action note-taking functionality</li>
              <li>Community sharing features</li>
              <li>Streak tracking and gamification</li>
              <li>Optional local daily reminders</li>
            </ul>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>User Accounts</span>
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Creation</h3>
            <ul className="space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to use this service</li>
              <li>One person may not maintain more than one account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Account Responsibilities</h3>
            <ul className="space-y-2">
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">User Content</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Content</h3>
            <ul className="space-y-2">
              <li>You retain ownership of content you create (action notes, profile information)</li>
              <li>By posting content, you grant us a license to display and distribute it within our service</li>
              <li>You are responsible for the content you post and its legality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Prohibited Content</h3>
            <p>You may not post content that:</p>
            <ul className="space-y-2">
              <li>Is illegal, harmful, or violates others' rights</li>
              <li>Contains hate speech, harassment, or discrimination</li>
              <li>Is spam, misleading, or fraudulent</li>
              <li>Violates intellectual property rights</li>
              <li>Contains personal information of others without consent</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Reporting and moderation</h3>
            <p>
              You can report community notes in the app (Notebook → tap a note → Report). We review
              reports within 24–48 hours and may remove content or restrict accounts that violate
              these Terms.
            </p>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <Shield className="w-6 h-6 text-emerald-600" />
              <span>Privacy and Data</span>
            </h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Service Availability</h2>
            <ul className="space-y-2">
              <li>We strive to maintain service availability but cannot guarantee 100% uptime</li>
              <li>We may modify, suspend, or discontinue the service at any time</li>
              <li>We will provide reasonable notice for planned maintenance</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Intellectual Property</h2>
            <ul className="space-y-2">
              <li>The Climate Note and its content are protected by copyright and other laws</li>
              <li>You may not copy, modify, or distribute our content without permission</li>
              <li>Our trademarks and logos may not be used without written consent</li>
            </ul>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <AlertTriangle className="w-6 h-6 text-emerald-600" />
              <span>Disclaimers and Limitations</span>
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Service "As Is"</h3>
            <p>
              The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be error-free or uninterrupted.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Limitation of Liability</h3>
            <p>
              We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Termination</h2>
            <ul className="space-y-2">
              <li>You may terminate your account at any time from the Profile tab → Delete account</li>
              <li>We may terminate accounts that violate these terms</li>
              <li>Upon termination, your right to use the service ceases immediately</li>
              <li>We may retain certain information as required by law or for legitimate business purposes</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes through the app or email. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction where The Climate Note is operated, without regard to conflict of law principles.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Information</h2>
            <p>If you have questions about these Terms of Service, contact us at:</p>
            <ul className="space-y-2">
              <li><strong>Email:</strong> legal@theclimatenote.com</li>
              <li><strong>Website:</strong> https://theclimatenote.bolt.host</li>
            </ul>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-8">
              <p className="text-emerald-800 text-sm">
                <strong>These terms of service were last updated on March 22, 2026.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}