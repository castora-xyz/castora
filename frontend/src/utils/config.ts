import { createConfig, http } from 'wagmi'
import { monad,  megaethTestnet} from 'wagmi/chains'

export const config = createConfig({
  chains: [monad,  megaethTestnet],
  transports: {
    [monad.id]: http(),
    [megaethTestnet.id]: http(),
  },
})