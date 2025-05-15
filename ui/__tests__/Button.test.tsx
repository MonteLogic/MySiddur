// components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../button';


describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>,
    );

    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies different styles based on kind prop', () => {
    const { rerender } = render(<Button kind="default">Default Button</Button>);
    expect(screen.getByText('Default Button')).toHaveClass('bg-gray-700');

    rerender(<Button kind="error">Error Button</Button>);
    expect(screen.getByText('Error Button')).toHaveClass('bg-vercel-pink');
  });

  it('merges custom className with default styles', () => {
    render(<Button className="custom-class">Styled Button</Button>);
    const button = screen.getByText('Styled Button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('px-3');
    expect(button).toHaveClass('py-1');
  });
});
