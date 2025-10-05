import { Breathing } from 'react-shimmer';

export const PoolDetailPageShimmer = () => {
  return (
    <div className="lg:w-full lg:max-w-screen-xl lg:mx-auto lg:flex grow pt-12">
      <div className="mb-8 lg:mb-px lg:mr-8 lg:grow lg:basis-1/2">
        <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full max-lg:max-w-lg max-lg:mx-auto">
          <Breathing className="grow w-full min-h-72 rounded-[24px]" />
        </div>

        <div className="max-lg:max-w-lg max-lg:mx-auto">
          <div className="grid grid-cols-2 gap-6 w-full mt-12 mb-8">
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
          </div>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 w-full">
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
            <Breathing className="px-2 py-4 rounded-lg text-center min-h-24" />
          </div>
        </div>
      </div>

      <div className="max-lg:max-w-lg max-lg:mx-auto lg:grow lg:basis-1/3">
        <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
          <Breathing height={64} className="mb-3 rounded-2xl w-full" />
          <Breathing height={64} className="mb-3 rounded-2xl w-full" />
          <Breathing height={64} className="mb-3 rounded-2xl w-full" />
          <Breathing height={64} className="mb-3 rounded-2xl w-full" />
          <Breathing height={64} className="mb-3 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
};
