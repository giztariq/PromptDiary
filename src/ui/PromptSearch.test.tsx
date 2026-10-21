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
    neverUsed: false,
    onNeverUsedChange: vi.fn(),
    unusedForDays: false,
    onUnusedForDaysChange: vi.fn(),
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
    expect(screen.getAllByRole('button')).toHaveLength(8);

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
    expect(screen.getByRole('button', { name: 'Note minimale : Toutes' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Note minimale : 3+' })).toHaveFocus();
  });

  it('toggles the usage filters', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PromptSearch {...props} />);

    const neverUsed = screen.getByRole('button', { name: 'Jamais utilisés' });
    const unused = screen.getByRole('button', { name: 'Non utilisés depuis 30 jours' });

    expect(neverUsed).toHaveAttribute('aria-pressed', 'false');
    await user.click(neverUsed);
    expect(props.onNeverUsedChange).toHaveBeenCalledExactlyOnceWith(true);

    await user.click(unused);
    expect(props.onUnusedForDaysChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('folds the tag list and expands it on demand', async () => {
    const user = userEvent.setup();
    const tags = Array.from({ length: 15 }, (_, index) => `tag-${index + 1}`);
    const props = { ...buildProps(), tags };
    render(<PromptSearch {...props} />);

    expect(screen.getByRole('button', { name: 'Tag : #tag-12' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tag : #tag-13' })).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: '+3 tags' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandButton);

    expect(screen.getByRole('button', { name: 'Tag : #tag-15' })).toBeVisible();
    const collapseButton = screen.getByRole('button', { name: 'Réduire' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(collapseButton);

    expect(screen.queryByRole('button', { name: 'Tag : #tag-15' })).not.toBeInTheDocument();
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
