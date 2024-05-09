import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { ethers } from "ethers";
import MetaMaskOnboarding from '@metamask/onboarding';
import { useUserContext } from "./context/userContext";
import Button from "./components/Button"
import Icon from './assets/icon_128.png'


const ONBOARD_TEXT = 'Click here to install MetaMask!';
const CONNECT_TEXT = 'Connect';
const CONNECTED_TEXT = 'Connected';

export default function Layout() {
  const {
    signer,
    setSigner,
    targetNetwork,
    isCorrectNetwork,
    setCorrectNetwork
  } = useUserContext()
  const [buttonText, setButtonText] = useState(ONBOARD_TEXT);
  const [isDisabled, setDisabled] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const onboarding = useRef<MetaMaskOnboarding>();


  async function addNetwork() {
    await window.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [targetNetwork],
    });
  }

  async function switchNetwork() {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetNetwork.chainId }],
    });
    setCorrectNetwork!(true);
  }

  async function verifyNetwork() {
    if (!isCorrectNetwork) {
      try {
        await switchNetwork();
      } catch (e) {
        await addNetwork();
        await switchNetwork();
      }
    }
  }

  useEffect(() => {
    const checkNetwork = async () => {
      const chainId: string = await window?.ethereum?.request({ method: 'eth_chainId' });
      console.log(chainId);
      console.log(targetNetwork.chainId);
      if (chainId.toLowerCase() === targetNetwork.chainId) {
        console.log('correct network');
        setCorrectNetwork!(true);
      } else {
        console.log('wrong network');
        setCorrectNetwork!(false);
      }
    }
    checkNetwork();
    const callback = () => {
      window.location.reload();
    };
    //@ts-ignore
    window.ethereum?.on('chainChanged', callback);

    return () => {
      //@ts-ignore
      window.ethereum?.removeListener('chainChanged', callback);
    }
  }, [])

  useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      if (accounts.length > 0) {
        setButtonText(CONNECTED_TEXT);
        setDisabled(true);
        onboarding?.current?.stopOnboarding();
      } else {
        setButtonText(CONNECT_TEXT);
        setDisabled(false);
      }
    }
  }, [accounts]);

  useEffect(() => {
    function handleNewAccounts(newAccounts: string[]) {
      setAccounts(newAccounts);
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        provider.getSigner().then((signer) => {
          setSigner!(signer);
        });
      }
    }
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        ?.request({ method: 'eth_requestAccounts' })
        .then(handleNewAccounts);
      //@ts-ignore
      window.ethereum?.on('accountsChanged', handleNewAccounts);
      return () => {
        //@ts-ignore
        window.ethereum.removeListener('accountsChanged', handleNewAccounts);
      };
    }
  }, []);

  const onClick = () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        ?.request({ method: 'eth_requestAccounts' })
        .then((newAccounts) => setAccounts(newAccounts));
    } else {
      onboarding?.current?.startOnboarding();
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <a className="flex items-center justify-center" href="#">
          <img
            className="h-6 w-6 sm:h-8 sm:w-8"
            src={Icon}
          />
          <span className="sr-only">Collect3</span>
        </a>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button
            onClick={onClick}
            disabled={isDisabled}
          >
            {buttonText}
          </Button>
          {!isCorrectNetwork && (
            <Button
              onClick={verifyNetwork}
              disabled={!signer || isCorrectNetwork}
            >
              Connect to Filecoin
            </Button>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Collect3. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </a>
        </nav>
      </footer>
    </div>
  )
}
