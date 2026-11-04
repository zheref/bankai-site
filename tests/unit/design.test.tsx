import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/design/Button';
import { Badge } from '@/design/Badge';
import { Tabs } from '@/design/Tabs';
import { Terminal } from '@/design/Terminal';
import { Wordmark } from '@/design/Wordmark';
import { Mark } from '@/design/Mark';
import { InlineMd } from '@/design/InlineMd';

describe('Button', () => {
  it('renders an internal link with Gatsby Link', () => {
    render(<Button to="/docs/">Docs</Button>);
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/');
  });
  it('renders an external link with rel=noopener', () => {
    render(<Button href="https://github.com/zheref">GitHub</Button>);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('rel', 'noopener');
  });
  it('renders a real button that fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it('carries its kind as data for tests and styling', () => {
    render(<Badge kind="tbd">TBD</Badge>);
    expect(screen.getByText('TBD')).toHaveAttribute('data-badge', 'tbd');
  });
  it('always carries visible text, never colour alone', () => {
    render(<Badge kind="available">Available</Badge>);
    expect(screen.getByText('Available')).toBeVisible();
  });
  it('defaults to the neutral kind', () => {
    render(<Badge>x</Badge>);
    expect(screen.getByText('x')).toHaveAttribute('data-badge', 'neutral');
  });
});

const tabs = [
  { id: 'a', label: 'A', content: <p>panel a</p> },
  { id: 'b', label: 'B', content: <p>panel b</p> },
  { id: 'c', label: 'C', content: <p>panel c</p> },
];
describe('Tabs', () => {
  it('shows the first panel and marks its tab selected', () => {
    render(<Tabs tabs={tabs} label="Surfaces" />);
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel a');
  });
  it('switches on click', () => {
    render(<Tabs tabs={tabs} label="Surfaces" />);
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');
  });
  it('moves with arrow keys and wraps at the ends', () => {
    render(<Tabs tabs={tabs} label="Surfaces" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'C' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Terminal', () => {
  const lines = [
    { kind: 'cmd' as const, text: '/hatsu:aka' },
    { kind: 'out' as const, text: 'pushed' },
    { kind: 'note' as const, text: 'G2 · the merge is yours' },
  ];
  it('keeps every line in the DOM from the start (screen readers get the whole transcript)', () => {
    const { container } = render(<Terminal lines={lines} />);
    expect(container.querySelectorAll('.term-line')).toHaveLength(3);
    expect(container.textContent).toContain('G2 · the merge is yours');
  });
  it('sets the animation order and character count per line as CSS variables', () => {
    const { container } = render(<Terminal lines={lines} />);
    const first = container.querySelector('.term-line') as HTMLElement;
    expect(first.style.getPropertyValue('--i')).toBe('0');
    expect(first.style.getPropertyValue('--n')).toBe(String('/hatsu:aka'.length));
  });
  it('puts the cursor on the last line only', () => {
    const { container } = render(<Terminal lines={lines} />);
    expect(container.querySelectorAll('.term-cursor')).toHaveLength(1);
  });
});

describe('Wordmark and Mark', () => {
  it('renders lowercase bankai with ai in the accent span', () => {
    const { container } = render(<Wordmark />);
    expect(container.querySelector('.wordmark')).toHaveAttribute('aria-label', 'bankai');
    expect(container.querySelector('.wordmark .ai')).toHaveTextContent('ai');
    expect(container.textContent).toBe('bankai');
  });
  it('renders every tier mark as a labelled svg with an accent gate', () => {
    for (const tier of ['bankai', 'nen', 'hatsu', 'handbooks', 'library', 'cloud'] as const) {
      const { container, unmount } = render(<Mark tier={tier} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg?.getAttribute('aria-label')).toBeTruthy();
      expect(container.innerHTML).toContain('var(--bk-accent)');
      unmount();
    }
  });
  it('renders collected inline html and nothing for an empty value', () => {
    const { container } = render(<InlineMd html="<code>aka</code> push" />);
    expect(container.querySelector('code')).toHaveTextContent('aka');
    const empty = render(<InlineMd html={null} />);
    expect(empty.container).toBeEmptyDOMElement();
  });
});
