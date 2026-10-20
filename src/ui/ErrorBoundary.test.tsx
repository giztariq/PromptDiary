import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

function BrokenView(): ReactElement {
  throw new Error('unexpected render failure');
}

describe('ErrorBoundary', () => {
  it('shows a recoverable fallback instead of a blank page', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Prompt Diary a rencontré un problème.');
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeVisible();
    consoleError.mockRestore();
  });
});
