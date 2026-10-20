import { render, screen } from '@testing-library/react';

import { HighlightedText } from './HighlightedText';

describe('HighlightedText', () => {
  it('highlights matches without case or accent sensitivity', () => {
    render(<HighlightedText text="Synthèse de réunion" query="synthese" />);

    expect(screen.getByText('Synthèse', { selector: 'mark' })).toBeVisible();
  });

  it('keeps the original accents inside the mark', () => {
    render(<HighlightedText text="ÉQUIPE produit" query="equipe" />);

    expect(screen.getByText('ÉQUIPE', { selector: 'mark' })).toBeVisible();
  });

  it('highlights every occurrence and leaves the rest untouched', () => {
    const { container } = render(<HighlightedText text="Analyse puis analyse." query="analyse" />);

    expect(container.querySelectorAll('mark')).toHaveLength(2);
    expect(container).toHaveTextContent('Analyse puis analyse.');
  });

  it('treats regular expression characters literally', () => {
    render(<HighlightedText text="Version 1.2" query="1.2" />);

    expect(screen.getByText('1.2', { selector: 'mark' })).toBeVisible();
  });

  it('renders plain text when nothing matches', () => {
    const { container } = render(<HighlightedText text="Analyse" query="email" />);

    expect(container.querySelector('mark')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Analyse');
  });
});
