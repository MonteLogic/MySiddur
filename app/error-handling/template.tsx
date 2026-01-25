import { Boundary } from '#/ui/shared/boundary';

export default function Template({ children }: { children: React.ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
