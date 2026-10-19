import { render, screen } from '@testing-library/react';

import App from './App';

describe('Prompt Diary foundation', () => {
  it('renders the application title', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Prompt Diary' })).toBeVisible();
  });
});
