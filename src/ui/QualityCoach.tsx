import { useEffect, useState } from 'react';

import { analyzePrompt, type AnalyzePromptResult } from '../domain/analyzePrompt';

interface QualityCoachProps {
  text: string;
}

function scoreTone(score: number): 'low' | 'medium' | 'high' {
  if (score <= 2) return 'low';
  if (score <= 4) return 'medium';
  return 'high';
}

export function QualityCoach({ text }: QualityCoachProps) {
  const [analysis, setAnalysis] = useState<AnalyzePromptResult>(() => analyzePrompt(text));

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnalysis(analyzePrompt(text)), 300);
    return () => window.clearTimeout(timeout);
  }, [text]);

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
        <span className={`coach-score coach-score--${tone}`}>Qualité : {analysis.score}/6</span>
      </div>
      <div className="coach-progress mt-4" aria-hidden="true">
        <span
          className={`coach-progress__bar coach-progress__bar--${tone}`}
          style={{ width: `${(analysis.score / 6) * 100}%` }}
        />
      </div>
      <div className="mt-5 grid gap-3">
        {analysis.checks.map((check) => (
          <div key={check.key} className="coach-check check-enter">
            <span
              className={
                check.passed ? 'coach-check__icon coach-check__icon--passed' : 'coach-check__icon'
              }
              aria-hidden="true"
            >
              {check.passed ? '✓' : '○'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{check.label}</p>
              {!check.passed && (
                <p className="mt-1 text-xs leading-5 text-muted">{check.suggestion}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
