import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import { PromptSearch } from './PromptSearch';

describe('PromptSearch tag chips', () => {
  it('shows a decorative cross only when selected and preserves mouse and keyboard toggles', async () => {
    const user = userEvent.setup();
    const onToggleTag = vi.fn();
    const props = {
      query: '',
      onQueryChange: vi.fn(),
      tags: ['analyse', 'email'],
      selectedTags: ['analyse'],
      onToggleTag,
      minRating: 0,
      onMinRatingChange: vi.fn(),
    };
    const { rerender } = render(<PromptSearch {...props} />);
    const selected = screen.getByRole('button', { name: 'Tag : analyse', pressed: true });
    const unselected = screen.getByRole('button', { name: 'Tag : email', pressed: false });
    const cross = within(selected).getByText('×');

    expect(cross).toBeVisible();
    expect(cross).toHaveAttribute('aria-hidden', 'true');
    expect(within(unselected).queryByText('×')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);

    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.tab();
    expect(selected).toHaveFocus();
    await user.click(cross);
    expect(onToggleTag).toHaveBeenCalledExactlyOnceWith('analyse');

    rerender(<PromptSearch {...props} selectedTags={[]} />);
    expect(selected).toHaveAttribute('aria-pressed', 'false');
    expect(within(selected).queryByText('×')).not.toBeInTheDocument();

    await user.tab();
    expect(unselected).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onToggleTag).toHaveBeenNthCalledWith(2, 'email');
    await user.keyboard(' ');
    expect(onToggleTag).toHaveBeenNthCalledWith(3, 'email');
    expect(onToggleTag).toHaveBeenCalledTimes(3);
    await user.tab();
    expect(screen.getByRole('combobox', { name: 'Note minimale' })).toHaveFocus();
  });
});
