import { createConfig, http } from 'wagmi'
import { mainnet, megaethTestnet} from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, megaethTestnet],
  transports: {
    [mainnet.id]: http(),
    [megaethTestnet.id]: http(),
  },
})