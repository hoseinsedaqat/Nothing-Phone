import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculatorApp from '../apps/calculator/CalculatorApp';
import AppIcon from '../components/AppIcon';
import Shade from '../components/shade/Shade';
import DotClock from '../components/DotClock';
import { useOS } from '../os/store';
import { APP_REGISTRY } from '../os/registry';

describe('components', () => {
  it('renders an app icon with its label', () => {
    render(<AppIcon appId="chrome" />);
    expect(screen.getByText('Chrome')).toBeInTheDocument();
  });

  it('ships an authentic color brand icon for every app', () => {
    useOS.getState().patchSystem({ iconStyle: 'color' });
    for (const app of APP_REGISTRY) {
      const { container, unmount } = render(<app.Icon size={40} />);
      expect(container.querySelector('svg')).toBeTruthy();
      unmount();
    }
  });

  it('renders monochrome glyphs when the mono icon style is selected', () => {
    useOS.getState().patchSystem({ iconStyle: 'mono' });
    const { container } = render(<AppIcon appId="phone" />);
    expect(container.querySelector('.app-icon-tile')).toHaveStyle({ background: '#3a3f45' });
    useOS.getState().patchSystem({ iconStyle: 'color' });
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

  it('dot-matrix clock renders the digits as dot grids', () => {
    const { container } = render(<DotClock value="07:51" size={72} />);
    expect(container.querySelectorAll('.dot-cell').length).toBeGreaterThan(50);
    expect(container.querySelector('.dot-colon')).toBeInTheDocument();
  });

  describe('control center shade', () => {
    beforeEach(() => {
      useOS.getState().patchSystem({ wifi: true, brightness: 55 });
      useOS.getState().setShade('qs');
    });

    it('renders one circular toggle per quick-setting tile', () => {
      render(<Shade />);
      expect(document.querySelectorAll('.qs-circle').length).toBe(9);
    });

    it('toggles connectivity state when a quick-setting button is pressed', () => {
      render(<Shade />);
      expect(useOS.getState().system.wifi).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: /wi-fi/i }));
      expect(useOS.getState().system.wifi).toBe(false);
    });

    it('drags the brightness pill slider and updates the store', () => {
      render(<Shade />);
      const track = document.querySelector('.pill-slider') as HTMLElement;
      expect(track).toBeTruthy();
      act(() => {
        track.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 0 }));
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 0 }));
        window.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 0 }));
      });
      expect(useOS.getState().system.brightness).toBe(100);
    });
  });
});
