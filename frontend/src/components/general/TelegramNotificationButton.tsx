import ChevronDown from '@/assets/chevron-down.svg?react';
import Telegram from '@/assets/telegram.svg?react';
import { useAuth, useFirebase, useTelegram } from '@/contexts';

import { Skeleton } from 'primereact/skeleton';

import { OverlayPanel } from 'primereact/overlaypanel';
import { Ripple } from 'primereact/ripple';
import { useRef } from 'react';

export const TelegramNotificationsButton = () => {
  const { signature } = useAuth();
  const { recordEvent } = useFirebase();
  const overlayRef = useRef<OverlayPanel>(null);
  const { isLoading, hasLinked, removeLink, startAuth } = useTelegram();

  if (!signature) return <></>;

  return (
    <>
      <button
        className="flex mr-3 px-3 py-2 rounded-full items-center border border-border-default dark:border-surface-subtle text-sm xl:text-base p-ripple"
        onClick={(e) => {
          overlayRef.current!.toggle(e);
          recordEvent('clicked_telegram_notifications');
        }}
      >
        <Ripple />
        <Telegram className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6" />
        <span className="hidden sm:inline md:hidden lg:inline">Notif.</span>
        <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
      </button>

      <OverlayPanel
        ref={overlayRef}
        pt={{ root: { className: 'p-0 rounded-lg w-screen max-w-sm bg-app-bg' } }}
      >
        <div>
          <h4 className="font-bold text-lg mb-4">Telegram Notifications</h4>
          {isLoading ? (
            <>
              <p className="my-4">Loading ...</p>
              <Skeleton width="212px" height="3rem" />
            </>
          ) : (
            <>
              {hasLinked ? (
                <ul className="list-primary-bullet list-disc pl-4 mb-6">
                  <li className="mb-2">✅ Linked to Telegram.</li>
                  <li className="mb-2">You will receive notifications on winnings.</li>
                  <li className="mb-2">You can unlink at any time.</li>
                </ul>
              ) : (
                <ul className="list-primary-bullet list-disc pl-4 mb-6">
                  <li className="mb-2">NOT Linked to Telegram.</li>
                  <li className="mb-2">Link now to receive notifications on winnings.</li>
                  <li className="mb-2">You can unlink at any time.</li>
                </ul>
              )}
              <div className="text-right pb-2 pr-2">
                {hasLinked ? (
                  <button
                    className="p-ripple px-4 py-2 rounded-full border border-errors-default text-errors-default text-sm"
                    onClick={async () => {
                      await removeLink();
                      overlayRef.current!.toggle(null);
                      recordEvent('clicked_remove_telegram_link');
                    }}
                  >
                    <Ripple />
                    UnLink Telegram
                  </button>
                ) : (
                  <button
                    className="p-ripple px-4 py-2 rounded-full bg-primary-default text-white text-sm"
                    onClick={async () => {
                      await startAuth();
                      overlayRef.current!.toggle(null);
                      recordEvent('clicked_link_telegram');
                    }}
                  >
                    <Ripple />
                    Link Telegram
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </OverlayPanel>
    </>
  );
};
