import { useEffect, useRef } from 'react';
import createWeb3Avatar from 'web3-avatar';

export const Web3Avatar = ({
  address,
  className
}: {
  address: string;
  className?: string;
}) => {
  const ref = useRef(null);

  useEffect(() => {
    createWeb3Avatar(ref.current!, address);
  }, []);

  return <div ref={ref} className={className ?? 'w-8 h-8'}></div>;
};
