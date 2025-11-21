'use client';

export default function MyProfilePage({ params }: { params: { userId: string } }) {
  return <div>Profile Page for {params.userId}</div>;
}
