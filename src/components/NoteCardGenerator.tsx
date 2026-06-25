import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2 } from 'lucide-react';
import { UserProfile, UserNote } from '../types';

interface NoteCardGeneratorProps {
  note: UserNote & { article_title?: string };
  userProfile: UserProfile;
  onClose: () => void;
}

const CARD_W = 1080;
const CARD_H = 1920;
const BOTTOM_SHEET_ESTIMATE = 240;

const themes = [
  {
    id: 'sage',
    name: 'Sage',
    from: '#2d4a32',
    to: '#6d9470',
    text: '#ffffff',
    accent: '#e8efe8',
    overlay: 'rgba(0,0,0,0.12)',
  },
  {
    id: 'cream',
    name: 'Cream',
    from: '#f5f7f4',
    to: '#d4e2d4',
    text: '#2d4a32',
    accent: '#4a634e',
    overlay: 'rgba(255,255,255,0.45)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    from: '#0c4a6e',
    to: '#0284c7',
    text: '#ffffff',
    accent: '#bae6fd',
    overlay: 'rgba(0,0,0,0.14)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    from: '#7c2d12',
    to: '#ea580c',
    text: '#ffffff',
    accent: '#fed7aa',
    overlay: 'rgba(0,0,0,0.12)',
  },
  {
    id: 'night',
    name: 'Night',
    from: '#1f3323',
    to: '#3d5240',
    text: '#f5f7f4',
    accent: '#b5cdb5',
    overlay: 'rgba(0,0,0,0.18)',
  },
];

interface QuoteTypography {
  fontSize: number;
  lineHeight: number;
  maxLines: number;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const word = words[wordIndex];
    const test = current ? `${current} ${word}` : word;

    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;

      if (lines.length >= maxLines - 1) {
        let lastLine = current;
        for (let i = wordIndex + 1; i < words.length; i += 1) {
          const candidate = `${lastLine} ${words[i]}`;
          if (ctx.measureText(`${candidate}…`).width > maxWidth) {
            lastLine = `${lastLine}…`;
            break;
          }
          lastLine = candidate;
        }
        lines.push(lastLine);
        return lines;
      }
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function getQuoteTypography(content: string): QuoteTypography {
  const length = content.length;
  if (length > 260) return { fontSize: 46, lineHeight: 68, maxLines: 12 };
  if (length > 180) return { fontSize: 54, lineHeight: 78, maxLines: 10 };
  if (length > 120) return { fontSize: 62, lineHeight: 90, maxLines: 9 };
  return { fontSize: 72, lineHeight: 102, maxLines: 8 };
}

function fitQuoteLayout(
  ctx: CanvasRenderingContext2D,
  content: string,
  textMaxWidth: number,
  contentTop: number,
  contentBottom: number,
) {
  let typography = getQuoteTypography(content);

  while (typography.fontSize >= 36) {
    ctx.font = `500 ${typography.fontSize}px Georgia, "Lora", serif`;
    const lines = wrapText(ctx, content, textMaxWidth, typography.maxLines);
    const totalTextHeight = lines.length * typography.lineHeight;
    const availableHeight = contentBottom - contentTop;

    if (totalTextHeight <= availableHeight) {
      const textStartY = contentTop + Math.max(0, (availableHeight - totalTextHeight) / 2);
      return { typography, lines, textStartY, totalTextHeight };
    }

    typography = {
      fontSize: typography.fontSize - 4,
      lineHeight: typography.lineHeight - 6,
      maxLines: typography.maxLines + 1,
    };
  }

  ctx.font = `500 ${typography.fontSize}px Georgia, "Lora", serif`;
  const lines = wrapText(ctx, content, textMaxWidth, typography.maxLines);
  const totalTextHeight = lines.length * typography.lineHeight;

  return { typography, lines, textStartY: contentTop, totalTextHeight };
}

export default function NoteCardGenerator({ note, userProfile, onClose }: NoteCardGeneratorProps) {
  const [themeIdx, setThemeIdx] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const theme = themes[themeIdx];
  const displayName =
    userProfile.display_name || userProfile.email?.split('@')[0] || 'Climate Writer';
  const streakCount = userProfile.streak || 0;

  const updatePreviewScale = useCallback(() => {
    const container = previewRef.current;
    if (!container || container.clientWidth === 0) return;

    const widthScale = container.clientWidth / CARD_W;
    const availableHeight = Math.max(window.innerHeight - BOTTOM_SHEET_ESTIMATE - 96, 320);
    const heightScale = availableHeight / CARD_H;
    setPreviewScale(Math.min(widthScale, heightScale, 0.45));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    updatePreviewScale();

    const container = previewRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => {
      updatePreviewScale();
    });

    observer.observe(container);
    window.addEventListener('resize', updatePreviewScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePreviewScale);
    };
  }, [updatePreviewScale]);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paddingX = 120;
    const textMaxWidth = CARD_W - paddingX * 2;
    const topBarHeight = 160;
    const bottomBarHeight = 300;
    const contentBottom = CARD_H - bottomBarHeight - 80;

    ctx.clearRect(0, 0, CARD_W, CARD_H);

    const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bg.addColorStop(0, theme.from);
    bg.addColorStop(1, theme.to);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = theme.text;
    ctx.beginPath();
    ctx.arc(CARD_W * 0.85, CARD_H * 0.12, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CARD_W * 0.12, CARD_H * 0.82, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.overlay;
    ctx.fillRect(0, 0, CARD_W, topBarHeight);
    ctx.fillRect(0, CARD_H - bottomBarHeight, CARD_W, bottomBarHeight);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.9;
    ctx.font = '600 42px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('The Climate Note', CARD_W / 2, topBarHeight / 2);
    ctx.restore();

    let contentTop = topBarHeight + 48;

    if (note.article_title) {
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.85;
      ctx.font = '500 34px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const titleLines = wrapText(ctx, note.article_title, textMaxWidth, 2);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, CARD_W / 2, topBarHeight + 28 + index * 42);
      });
      ctx.restore();

      contentTop = topBarHeight + 28 + titleLines.length * 42 + 36;
    }

    const { typography, lines, textStartY, totalTextHeight } = fitQuoteLayout(
      ctx,
      note.content,
      textMaxWidth,
      contentTop,
      contentBottom,
    );

    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.22;
    ctx.font = '700 180px Georgia, "Lora", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u201C', paddingX - 20, Math.max(contentTop - 12, textStartY - 24));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.font = `500 ${typography.fontSize}px Georgia, "Lora", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((line, index) => {
      ctx.fillText(line, CARD_W / 2, textStartY + index * typography.lineHeight);
    });
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.22;
    ctx.font = '700 180px Georgia, "Lora", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('\u201D', CARD_W - paddingX + 20, textStartY + totalTextHeight - 40);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.font = '600 56px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, CARD_W / 2, CARD_H - bottomBarHeight + 72);
    ctx.restore();

    if (streakCount > 0) {
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.95;
      ctx.font = '500 40px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${streakCount} day streak`, CARD_W / 2, CARD_H - bottomBarHeight + 148);
      ctx.restore();
    }

    const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.65;
    ctx.font = '400 36px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateStr, CARD_W / 2, CARD_H - bottomBarHeight + (streakCount > 0 ? 210 : 168));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.4;
    ctx.font = '400 30px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('theclimatenote.com', CARD_W / 2, CARD_H - 52);
    ctx.restore();
  }, [theme, note, displayName, streakCount]);

  useEffect(() => {
    drawCard();
  }, [drawCard]);

  const getBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error('No canvas'));
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/png',
      );
    });

  const handleDownload = async () => {
    const blob = await getBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climate-note-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'climate-note.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Climate Note',
          text: 'Check out my climate action note on The Climate Note!',
        });
      } else {
        await handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed, downloading instead:', err);
        await handleDownload();
      }
    } finally {
      setSharing(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-forest/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-note-title"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-lg flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 text-white">
          <div>
            <h3 id="share-note-title" className="font-serif text-lg font-medium">
              Share your note
            </h3>
            <p className="text-xs text-white/70 mt-0.5">Story size · 1080×1920</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={previewRef}
          className="flex flex-1 items-center justify-center px-4 pb-2 min-h-0"
        >
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={CARD_H}
            className="max-h-full max-w-full rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            style={{
              width: `${Math.round(CARD_W * previewScale)}px`,
              height: `${Math.round(CARD_H * previewScale)}px`,
            }}
          />
        </div>

        <div className="rounded-t-[28px] bg-white px-5 pt-5 pb-6 safe-bottom shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
          <p className="text-editorial-label mb-3">Color theme</p>
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {themes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeIdx(index)}
                title={item.name}
                className={`h-9 w-9 shrink-0 rounded-full border-2 transition-all ${
                  themeIdx === index ? 'border-forest scale-110' : 'border-transparent'
                }`}
                style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sage-200 py-3 text-sm font-medium text-forest hover:bg-sage-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-medium text-white hover:bg-forest-light disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? 'Sharing…' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
