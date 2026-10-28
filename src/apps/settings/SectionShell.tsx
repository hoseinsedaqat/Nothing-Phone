import type { FC, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export interface SectionProps {
  onBack: () => void;
  params?: Record<string, unknown>;
}

const SectionShell: FC<{ title: string; onBack: () => void; children: ReactNode }> = ({
  title,
  onBack,
  children,
}) => (
  <div className="settings-section-page">
    <header className="app-header">
      <button className="app-header-btn" onClick={onBack} aria-label="Back">
        <ChevronLeft size={22} />
      </button>
      <h1>{title}</h1>
    </header>
    <div className="app-body app-scroll">{children}</div>
  </div>
);

export default SectionShell;
