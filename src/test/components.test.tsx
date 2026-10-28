import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculatorApp from '../apps/calculator/CalculatorApp';
import AppIcon from '../components/AppIcon';

describe('components', () => {
  it('renders an app icon with its label', () => {
    render(<AppIcon appId="chrome" />);
    expect(screen.getByText('Chrome')).toBeInTheDocument();
  });

  it('calculator performs a real addition', async () => {
    const user = userEvent.setup();
    render(<CalculatorApp />);
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByText('+'));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByText('='));
    const display = document.querySelector('.calc-display strong');
    expect(display?.textContent).toBe('13');
  });

  it('calculator handles division by zero gracefully', () => {
    render(<CalculatorApp />);
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('÷'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('='));
    expect(document.querySelector('.calc-display strong')?.textContent).toBe('Error');
  });
});
