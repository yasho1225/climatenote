import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { permanentlyDeleteAccount } from '../lib/deleteAccount';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { showToast } from './ui/Toast';

interface DeleteAccountScreenProps {
  email?: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

const DELETED_ITEMS = [
  'Your profile and display name',
  'All climate action notes',
  'Streak, goals, and impact data',
  'Your sign-in credentials',
];

export default function DeleteAccountScreen({
  email,
  onClose,
  onDeleted,
}: DeleteAccountScreenProps) {
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useScrollToTop(step);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setDeleting(true);
    try {
      await permanentlyDeleteAccount();
      showToast('Your account has been permanently deleted.', 'success');
      onDeleted();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account. Please try again.';
      if (import.meta.env.DEV) {
        console.error('Account deletion error:', err);
      }
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col app-overlay">
      <header className="sticky top-0 app-chrome px-4 py-3 flex items-center gap-3 border-b safe-top">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="flex items-center gap-1.5 text-sage-600 font-medium text-sm disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="font-bold text-forest text-sm">Delete account</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-6" data-scroll-root>
        {step === 'warning' ? (
          <>
            <div className="card-surface p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-forest">Delete your account?</h2>
                <p className="text-sm text-sage-600 leading-relaxed">
                  This permanently removes your account and all associated data. You cannot undo
                  this action.
                </p>
              </div>
              {email ? (
                <p className="text-xs text-sage-500 bg-sage-50 rounded-xl py-2 px-3">
                  Account: <span className="font-medium text-forest">{email}</span>
                </p>
              ) : null}
            </div>

            <div className="card-surface p-5 space-y-3">
              <p className="text-sm font-semibold text-forest">What will be deleted</p>
              <ul className="space-y-2">
                {DELETED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-sage-600">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="w-full py-3.5 rounded-3xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Continue to confirmation
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-3xl border border-sage-200 text-forest font-semibold text-sm hover:bg-sage-50 transition-colors"
              >
                Keep my account
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card-surface p-6 space-y-4 border border-red-100">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="font-semibold text-sm">Final confirmation</p>
              </div>
              <p className="text-sm text-sage-600 leading-relaxed">
                To confirm permanent deletion, type{' '}
                <span className="font-bold text-red-600">DELETE</span> below.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                autoComplete="off"
                autoCapitalize="characters"
                className="input-field text-center font-semibold tracking-wider"
                disabled={deleting}
              />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmText !== 'DELETE'}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Deleting account…' : 'Permanently delete account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('warning');
                  setConfirmText('');
                }}
                disabled={deleting}
                className="w-full py-3.5 rounded-3xl text-sage-600 font-medium text-sm hover:bg-sage-50 transition-colors disabled:opacity-50"
              >
                Go back
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
