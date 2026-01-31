import { Boundary } from '#/ui/shared/boundary';
import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return <Boundary animateRerendering={false}>{children}</Boundary>;
}
