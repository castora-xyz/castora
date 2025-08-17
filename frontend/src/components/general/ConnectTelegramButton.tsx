import { useServer, useToast } from '@/contexts';
import { useEffect, useRef } from 'react';

export const ConnectTelegramButton = () => {
  const server = useServer();
  const { toastSuccess } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', '');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    containerRef.current?.appendChild(script);

    (window as any).onTelegramAuth = async (user: any) => {
      const isSuccess = await server.post('/user/telegram', user);
      if (isSuccess) {
        let { first_name, username } = user;
        if (username) username = `@${username}`;
        toastSuccess(
          'Telegram login successful!',
          `${username ?? first_name} on Telegram will now receive notifications.`
        );
      }
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      if (containerRef.current) containerRef.current.innerHTML = '';
      delete (window as any).onTelegramAuth;
    };
  }, []);

  return <div ref={containerRef} className="mr-3"></div>;
};
