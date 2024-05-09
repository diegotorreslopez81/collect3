import { useUserContext } from '../context/userContext'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Button from '../components/Button'
import abi from '../utils/abi'

export default function Mint() {
  const { signer, targetNetwork, isCorrectNetwork } = useUserContext()
  const [id, setId] = useState<number>(0);
  const [minting, setMinting] = useState<boolean>(false)
  const [minted, setMinted] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [contract, setContract] = useState<ethers.BaseContract>()
  const [hash, setHash] = useState<string>()

  const { cid } = useParams();
  let [searchParams] = useSearchParams();

  function removeHtmlSymbols(html: string) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  let title = searchParams.get('title');
  if (title) {
    title = decodeURIComponent(title);
  }
  let description = searchParams.get('description');
  if (description) {
    description = decodeURIComponent(description);
    description = removeHtmlSymbols(description);
  }

  const fetchData = async () => {
    let localId = 0;
    try {
      const raw = await fetch(`${import.meta.env.VITE_API_URL}nft/id/${cid}`);
      const json: { id: number } = await raw.json();
      setId(json.id);
      localId = json.id;
    } catch (err) {
      console.log(err)
    }

    // if (!localId) return
    // let localmetadata
    // try {
    //   const raw = await fetch(`${import.meta.env.VITE_API_URL}metadata/${cid}`);
    //   localmetadata = await raw.json();
    //   console.log(localmetadata)
    // } catch (err) {
    //   console.log(err)
    // }
  }

  useEffect(() => {
    if (cid) {
      fetchData();
    }
  }, [])

  useEffect(() => {
    if (signer) {
      const instance = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        abi,
        signer,
      );
      const parsedContract = instance.connect(signer);
      const balance = async () => {
        //@ts-ignore
        const balance = await parsedContract.balanceOf(signer?.address, id)
        console.log("balance", balance);

        if (balance > 0) {
          console.log("already minted");
          setMinted(true);
        }
      }
      balance();
      setContract(parsedContract);
    }
  }, [signer])

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          {(!minting && !minted) && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  {title}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {description}
                </p>
              </div>
              <Button
                onClick={async () => {
                  if (!isCorrectNetwork) {
                    return toast.error('Please switch to the correct network');
                  }
                  try {
                    setMinting(true);
                    //setMinted(false)
                    setError('');
                    //@ts-ignore
                    const tx = await contract.mint(id);
                    console.log('tx', tx);
                    const receipt = await tx.wait();
                    console.log('receipt', receipt);
                    console.log('tx again', tx);
                    setHash(tx.hash);
                    setMinted(true);
                    try {
                      const raw = await fetch(
                        import.meta.env.VITE_API_URL + 'nft',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            uid: `${id}`,
                            cid: cid,
                          }),
                        }
                      );
                      console.log(raw);
                    } catch (err) {
                      console.log(err);
                    }
                    console.log(tx);
                  } catch (err) {
                    console.log(err);
                  } finally {
                    setMinting(false);
                  }
                }}
                disabled={!signer || !contract || minting || minted}
              >
                MINT
              </Button>
            </div>
          )}
          {minting && (
            <div className="space-y-2">
              <div className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Minting...
              </div>
              <div className="flex justify-center items-center">
                <div className="w-8 h-8 rounded-full border-l-2 border-blue-500 animate-spin"></div>
              </div>
            </div>
          )}
          {minted && (
            <div className="space-y-2">
              <div className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Minted
              </div>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                You have successfully minted your NFT.
              </p>
              <div className="space-x-4">
                <a
                  className="inline-flex text-indigo-500 h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href={`${targetNetwork.blockExplorerUrls[0]}en/${!!hash ? 'message' : 'address'}/${!!hash ? hash : signer?.address}`}
                  target="_blank"
                >
                  Check in Block Explorer
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position='top-left'
        autoClose={3000}
      />
    </section>
  )
}
