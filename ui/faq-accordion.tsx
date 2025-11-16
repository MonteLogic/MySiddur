'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface FAQAccordionProps {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'nested';
}

export function FAQAccordion({ question, children, defaultOpen = false, variant = 'default' }: FAQAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      // Measure the inner content div for accurate height
      if (innerContentRef.current) {
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          if (innerContentRef.current) {
            const height = innerContentRef.current.scrollHeight;
            setContentHeight(isOpen ? height : 0);
          }
        });
      }
    };

    if (isOpen) {
      // For opening, set height with a small delay to ensure content is rendered
      updateHeight();
      // Also update after a brief delay to catch any dynamic content
      const timeout = setTimeout(updateHeight, 50);
      return () => clearTimeout(timeout);
    } else {
      // For closing, set to current height first, then animate to 0
      if (innerContentRef.current) {
        setContentHeight(innerContentRef.current.scrollHeight);
        requestAnimationFrame(() => {
          setContentHeight(0);
        });
      }
    }
  }, [isOpen]);

  // Update height when content changes (e.g., nested accordions)
  useEffect(() => {
    if (isOpen && innerContentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (innerContentRef.current) {
          setContentHeight(innerContentRef.current.scrollHeight);
        }
      });
      resizeObserver.observe(innerContentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isOpen, children]);

  const isNested = variant === 'nested';

  return (
    <div className={clsx(
      'border-b border-gray-700',
      isNested && 'border-gray-600/50'
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between text-left transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded',
          isNested ? 'py-3 px-3 hover:bg-gray-700/30' : 'py-4 px-2 hover:bg-gray-700/50'
        )}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${question.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className={clsx(
          'pr-4 flex-1',
          isNested ? 'font-medium text-gray-200' : 'font-semibold text-white'
        )}>
          {question}
        </span>
        <div className="flex-shrink-0 ml-2">
          <div className={clsx(
            'w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-200',
            isOpen 
              ? 'border-blue-400 bg-blue-500/20' 
              : 'border-gray-500 hover:border-gray-400 hover:bg-gray-700/50'
          )}>
            <span className={clsx(
              'text-xl font-light leading-none transition-transform duration-200 text-gray-300 flex items-center justify-center',
              isOpen ? 'rotate-45' : ''
            )}>
              +
            </span>
          </div>
        </div>
      </button>
      <div
        id={`accordion-content-${question.replace(/\s+/g, '-').toLowerCase()}`}
        ref={contentRef}
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          maxHeight: typeof contentHeight === 'number' ? `${contentHeight}px` : 'none',
        }}
        aria-hidden={!isOpen}
      >
        <div 
          ref={innerContentRef}
          className={clsx(
            'text-gray-300',
            isNested ? 'py-3 px-3 space-y-2' : 'py-4 px-2 space-y-3'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

