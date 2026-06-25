import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { openReportContent } from '../../lib/legalLinks';

interface ReportNoteSheetProps {
  noteId: string;
  excerpt: string;
  onClose: () => void;
}

export default function ReportNoteSheet({ noteId, excerpt, onClose }: ReportNoteSheetProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    openReportContent(noteId, excerpt, reason.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close report dialog"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md app-card p-5 space-y-4 shadow-xl"
        role="dialog"
        aria-labelledby="report-note-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-600" aria-hidden />
            <h2 id="report-note-title" className="font-bold text-ink text-base">
              Report this note
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:bg-mist"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-ink-muted leading-relaxed">
          Tell us what is wrong with this community note. We review reports within 24–48 hours and
          may remove content that violates our Terms.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional: why are you reporting this note?"
          rows={4}
          className="input-field resize-none text-sm"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-sage-200 text-ink-soft font-semibold text-sm hover:bg-mist"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
          >
            Send report
          </button>
        </div>
      </div>
    </div>
  );
}
