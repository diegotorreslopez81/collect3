//create a context provider for the walletProvider and signer
import { createContext, useState, ReactNode, useContext } from 'react'
import { JsonRpcSigner } from "ethers";

const filecoinIcon = "https://docs.filecoin.io/~gitbook/image?url=https:%2F%2F3376433986-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FxNWFG7bQkjLkl5BBGjbD%252Ficon%252FMFhg0h7DDwlyjF3FRItf%252FFilecoin.svg.png%3Falt=media%26token=b79c504b-c727-4a40-8fc0-7598a5263d24&width=32&dpr=1&quality=100&sign=24d1a215709f4bfc94d151dedabc2b55b9d80dd0993dd16657308232dfb68b02"
const envToNetWork = {
  dev: {
    chainId: '0x4cb2f',
    chainName: 'Filecoin Tesnet',
    rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
    nativeCurrency: {
      name: 'Filecoin',
      symbol: 'tFIL',
      decimals: 18,
    },
    blockExplorerUrls: ['https://calibration.filfox.info/'],
    iconUrl: [filecoinIcon],
  },
  prod: {
    chainId: '0x13a',
    chainName: 'Filecoin',
    rpcUrls: ['https://api.node.glif.io/rpc/v1'],
    nativeCurrency: {
      name: 'Filecoin',
      symbol: 'FIL',
      decimals: 18,
    },
    blockExplorerUrls: ['https://filfox.info/'],
    iconUrl: [filecoinIcon],
  }
} as const;
const targetNetwork = envToNetWork[import.meta.env.VITE_ENV as 'prod' | 'dev'];

type UserContextType = {
  signer: JsonRpcSigner | undefined,
  setSigner?: (signer: JsonRpcSigner) => void,
  targetNetwork: typeof targetNetwork
};
const initialValue: UserContextType = {
  signer: undefined,
  targetNetwork
};

type props = {
  children: ReactNode,
};

const UserContext = createContext<UserContextType>(initialValue);

export const UserProvider = ({ children }: props) => {
  const [signer, setSigner] = useState<JsonRpcSigner>();

  return (
    <UserContext.Provider
      value={{ signer, setSigner, targetNetwork }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
