import { Suspense } from 'react';
import CountryContent from './CountryContent';
import TopMenu from "@/components/TopMenu";

export default async function CountryPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  return (
    <main className="flex flex-col min-h-screen bg-[#fafafa]">
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center">
        <TopMenu />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CountryContent id={params.id} />
      </Suspense>
    </main>
  );
}
