import { Boundary } from '#/ui/boundary';

export default function Template({ children }: { children: React.ReactNode }) {
  return (

    <div className="bg-gray-900">
      <Boundary animateRerendering={false} labels={[""]}>{children}</Boundary>
    </div>

  )
}
