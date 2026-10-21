import { useEffect, useRef, useState } from 'react';

import { analyzePrompt, type AnalyzePromptResult, type Check } from '../domain/analyzePrompt';
import type { PromptPatch } from '../domain/coach';

interface QualityCoachProps {
  text: string;
  onApplyPatch?: (patch: PromptPatch) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

function scoreTone(score: number): 'low' | 'medium' | 'high' {
  if (score <= 2) return 'low';
  if (score <= 4) return 'medium';
  return 'high';
}

function CoachCheckRow({
  check,
  onApplyPatch,
}: {
  check: Check;
  onApplyPatch?: (patch: PromptPatch) => void;
}) {
  const { patch } = check;

  return (
    <div className="coach-check check-enter">
      <span
        className={
          check.passed ? 'coach-check__icon coach-check__icon--passed' : 'coach-check__icon'
        }
        aria-hidden="true"
      >
        {check.passed ? '✓' : '○'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{check.label}</p>
        {!check.passed && <p className="mt-1 text-xs leading-5 text-muted">{check.suggestion}</p>}
        {!check.passed && patch && onApplyPatch && (
          <button
            type="button"
            onClick={() => onApplyPatch(patch)}
            className="button-secondary mt-2 min-h-8 px-2 py-1 text-xs"
          >
            Corriger
          </button>
        )}
      </div>
    </div>
  );
}

export function QualityCoach({ text, onApplyPatch, onUndo, canUndo }: QualityCoachProps) {
  const [analysis, setAnalysis] = useState<AnalyzePromptResult>(() => analyzePrompt(text));
  const [bumping, setBumping] = useState(false);
  const previousScore = useRef(analysis.score);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnalysis(analyzePrompt(text)), 300);
    return () => window.clearTimeout(timeout);
  }, [text]);

  useEffect(() => {
    if (analysis.score > previousScore.current) {
      setBumping(true);
      const timeout = window.setTimeout(() => setBumping(false), 600);
      previousScore.current = analysis.score;
      return () => window.clearTimeout(timeout);
    }

    previousScore.current = analysis.score;
    return undefined;
  }, [analysis.score]);

  const tone = scoreTone(analysis.score);

  return (
    <aside className="coach-panel" aria-labelledby="coach-heading" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Qualité</p>
          <h3 id="coach-heading" className="mt-2 text-xl font-semibold text-ink">
            Aperçu &amp; coach
          </h3>
        </div>
        <span className={`coach-score coach-score--${tone} ${bumping ? 'coach-score--bump' : ''}`}>
          Qualité : {analysis.score}/6
        </span>
      </div>
      <div className="coach-progress mt-4" aria-hidden="true">
        <span
          className={`coach-progress__bar coach-progress__bar--${tone}`}
          style={{ width: `${(analysis.score / 6) * 100}%` }}
        />
      </div>
      <div className="mt-5 grid gap-3">
        {analysis.checks.map((check) => (
          <CoachCheckRow key={check.key} check={check} onApplyPatch={onApplyPatch} />
        ))}
      </div>
      {canUndo && onUndo && (
        <button type="button" onClick={onUndo} className="button-secondary mt-4 w-full text-xs">
          Annuler la correction
        </button>
      )}
    </aside>
  );
}
