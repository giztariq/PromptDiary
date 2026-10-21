import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import { PromptSearch } from './PromptSearch';

function buildProps() {
  return {
    query: '',
    onQueryChange: vi.fn(),
    tags: ['analyse', 'email'],
    selectedTags: ['analyse'],
    onToggleTag: vi.fn(),
    minRating: 0,
    onMinRatingChange: vi.fn(),
    favoritesOnly: false,
    onFavoritesOnlyChange: vi.fn(),
    sort: 'priority' as const,
    onSortChange: vi.fn(),
  };
}

describe('PromptSearch filters', () => {
  it('shows a decorative cross only when selected and preserves mouse and keyboard toggles', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    const { rerender } = render(<PromptSearch {...props} />);
    const selected = screen.getByRole('button', { name: 'Tag : #analyse', pressed: true });
    const unselected = screen.getByRole('button', { name: 'Tag : #email', pressed: false });
    const cross = within(selected).getByText('×');

    expect(cross).toBeVisible();
    expect(cross).toHaveAttribute('aria-hidden', 'true');
    expect(within(unselected).queryByText('×')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(7);

    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.tab();
    expect(selected).toHaveFocus();
    await user.click(cross);
    expect(props.onToggleTag).toHaveBeenCalledExactlyOnceWith('analyse');

    rerender(<PromptSearch {...props} selectedTags={[]} />);
    expect(selected).toHaveAttribute('aria-pressed', 'false');
    expect(within(selected).queryByText('×')).not.toBeInTheDocument();

    await user.tab();
    expect(unselected).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(props.onToggleTag).toHaveBeenNthCalledWith(2, 'email');
    await user.keyboard(' ');
    expect(props.onToggleTag).toHaveBeenNthCalledWith(3, 'email');
    expect(props.onToggleTag).toHaveBeenCalledTimes(3);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Favoris' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Note minimale : Toutes' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Note minimale : 3+' })).toHaveFocus();
  });

  it('toggles the favorites filter and reports the new value', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PromptSearch {...props} />);

    const favorites = screen.getByRole('button', { name: 'Favoris' });
    expect(favorites).toHaveAttribute('aria-pressed', 'false');

    await user.click(favorites);
    expect(props.onFavoritesOnlyChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('exposes the sort options in a labelled select', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PromptSearch {...props} />);

    const select = screen.getByLabelText('Trier par');
    expect(select).toHaveValue('priority');
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Priorité', 'Nouveautés', 'Les plus utilisés', 'Mieux notés', 'Titre A → Z']);

    await user.selectOptions(select, 'usage');
    expect(props.onSortChange).toHaveBeenCalledExactlyOnceWith('usage');
  });
});
