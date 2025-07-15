import { useTheme } from '@/contexts';
import { useEffect, useRef } from 'react';

export const TradingViewChart = ({ pair }: { pair: string }) => {
  const container = useRef<HTMLDivElement>(null);
  const { isDarkDisplay } = useTheme();

  useEffect(() => {
    if (container.current) container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          container_id: 'tv_chart_container',
          allow_symbol_change: false,
          autosize: true,
          enabled_features: ['header_fullscreen_button'],
          enable_publishing: false,
          interval: '180',
          style: '1',
          symbol: pair,
          theme: isDarkDisplay ? 'dark' : 'light',
          withdateranges: true
        });
      }
    };

    container.current!.appendChild(script);
  }, [isDarkDisplay]);

  return <div ref={container} id="tv_chart_container" />;
};
