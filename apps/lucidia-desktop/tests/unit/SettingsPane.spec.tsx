import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SettingsPane } from '../../src/ui/components/Settings/SettingsPane';

expect.extend(toHaveNoViolations);

describe('SettingsPane', () => {
  it('renders network toggles', () => {
    render(<SettingsPane />);
    expect(screen.getByText('Allow gateway access')).toBeInTheDocument();
  });

  it('allows toggling network settings', () => {
    render(<SettingsPane />);
    const checkbox = screen.getByLabelText('Allow gateway access');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SettingsPane />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
