//create a context provider for the walletProvider and signer
import { createContext, useState, ReactNode, useContext } from 'react'
import { JsonRpcSigner } from "ethers";

const envToNetWork = {
  dev: {
    chainId: '0x4cb2f',
    chainName: 'Filecoin - Calibration testnet',
    rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
    nativeCurrency: {
      name: 'Filecoin',
      symbol: 'tFIL',
      decimals: 18,
    },
    blockExplorerUrls: ['https://calibration.filfox.info/'],
  },
  prod: {
    chainId: '0x13a',
    chainName: 'Filecoin - Mainnet',
    rpcUrls: ['https://api.node.glif.io/rpc/v1'],
    nativeCurrency: {
      name: 'Filecoin',
      symbol: 'FIL',
      decimals: 18,
    },
    blockExplorerUrls: ['https://filfox.info/'],
  }
} as const;
const targetNetwork = envToNetWork[import.meta.env.VITE_ENV as 'prod' | 'dev'];

type UserContextType = {
  signer: JsonRpcSigner | undefined,
  setSigner?: (signer: JsonRpcSigner) => void,
  targetNetwork: typeof targetNetwork,
  isCorrectNetwork: boolean,
  setCorrectNetwork?: (correctNetwork: boolean) => void
};
const initialValue: UserContextType = {
  signer: undefined,
  targetNetwork,
  isCorrectNetwork: false
};

type props = {
  children: ReactNode,
};

const UserContext = createContext<UserContextType>(initialValue);

export const UserProvider = ({ children }: props) => {
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [isCorrectNetwork, setCorrectNetwork] = useState<boolean>(false);

  return (
    <UserContext.Provider
      value={{ signer, setSigner, targetNetwork, isCorrectNetwork, setCorrectNetwork }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
