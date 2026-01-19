import { ReactNode } from 'react';

export const SuccessIcon = ({ child }: { child: ReactNode }) => {
  return (
    <div className="relative p-2 mb-4">
      <div className="w-fit mx-auto bg-success-subtle dark:bg-success-darker absolute z-0 rounded-full left-0 right-0 animate-grow transition">
        <div className="bg-success-lighter invisible dark:bg-success-default p-2 rounded-full w-fit mx-auto relative">
          <div className="bg-success-default dark:bg-success-lighter p-3 rounded-full">
            {child}
          </div>
        </div>
      </div>
      <div className="bg-success-lighter dark:bg-success-default p-2 rounded-full w-fit mx-auto relative">
        <div className="bg-success-default dark:bg-success-lighter p-3 rounded-full">
          {child}
        </div>
      </div>
    </div>
  );
};
