import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">Last updated: March 22, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4">
              <Eye className="w-6 h-6 text-emerald-600" />
              <span>Introduction</span>
            </h2>
            <p>
              The Climate Note ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and web service.
            </p>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <Database className="w-6 h-6 text-emerald-600" />
              <span>Information We Collect</span>
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
            <ul className="space-y-2">
              <li><strong>Email Address:</strong> Used for account creation and authentication</li>
              <li><strong>User-Generated Content:</strong> Your personal climate action notes and profile information</li>
              <li><strong>Usage Data:</strong> How you interact with articles and features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Automatically Collected Information</h3>
            <ul className="space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, app version</li>
              <li><strong>Notification Preferences:</strong> Your reminder settings stored on your device</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">AI Processing</h2>
            <p>
              When you use article summaries, action suggestions, or impact estimates, we send relevant
              article text and your action notes to <strong>Google Gemini</strong> via our secure servers
              to generate responses. We do not sell this data. See Google&apos;s AI terms for their handling
              of API requests.
            </p>
            <p className="mt-2">
              Environmental impact figures shown in the app are <strong>modeled estimates</strong>, not
              verified measurements.
            </p>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>How We Use Your Information</span>
            </h2>
            <p>We use your information to:</p>
            <ul className="space-y-2">
              <li>Provide and maintain our service</li>
              <li>Send you daily environmental articles</li>
              <li>Enable community features (shared action notes)</li>
              <li>Send optional local reminders</li>
              <li>Improve our app and user experience</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information. We may share information in these limited circumstances:</p>
            <ul className="space-y-2">
              <li><strong>Community Features:</strong> Your display name and shared action notes may be visible to other users. Your email is never shown publicly.</li>
              <li><strong>Service Providers:</strong> Supabase (hosting/database), Google Gemini (AI features), Apple/Google (sign-in, if you choose them)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul className="space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure database storage with Supabase</li>
              <li>Regular security updates and monitoring</li>
              <li>Limited access to personal data</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt-out of notifications</li>
            </ul>
            <p>To exercise these rights, contact us at privacy@theclimatenote.com</p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Retention</h2>
            <p>We retain your information as long as your account is active or as needed to provide services. You can delete your account at any time through the app settings.</p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Children's Privacy</h2>
            <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">International Users</h2>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.</p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes through the app or email.</p>

            <h2 className="flex items-center space-x-2 text-2xl font-bold text-gray-900 mb-4 mt-8">
              <Mail className="w-6 h-6 text-emerald-600" />
              <span>Contact Us</span>
            </h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
            <ul className="space-y-2">
              <li><strong>Email:</strong> privacy@theclimatenote.com</li>
              <li><strong>Support:</strong> support@theclimatenote.com</li>
            </ul>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-8">
              <p className="text-emerald-800 text-sm">
                <strong>This privacy policy was last updated on March 22, 2026.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}