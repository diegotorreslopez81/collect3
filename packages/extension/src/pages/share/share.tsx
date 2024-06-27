'use strict';
import { createSignal, JSX } from "solid-js";
import { render } from "solid-js/web";

import "./share.css";
import { getAddress } from "ethers";
import { shareEncrypted } from "../../utils/backend";
import { connectToMetamask } from "../../utils/utils";
import { getActiveStorage } from "../../utils/storage";

const params = new URLSearchParams(location.search);
const cid = params.get('cid');

export function App(): JSX.Element {
  const [receiverAddress, setReceiverAddress] = createSignal('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const storage = await getActiveStorage();
    const value = receiverAddress()?.trim();
    if (!value) {
      console.log("address empty");
      return
    }

    if (!cid) {
      console.log("cid empty");
      return
    }

    let address: string = '';

    try {
      address = getAddress(value);
    } catch (error) {
      console.log(error);
      return
    }

    try {
      const signer = await connectToMetamask();

      const response = await shareEncrypted(cid, signer, [address]);
      await fetch(`${storage.url}share`, {
        method: "POST",
        body: JSON.stringify({
          uid: address,
          cid,
        }),
      });
      console.log(response);
      if (response?.data.status?.toLowerCase() === 'success') {
        chrome.runtime.sendMessage({
          type: "success",
          message: "content shared successfully",
        });
        setReceiverAddress('');
      } else {
        chrome.runtime.sendMessage({
          type: "error",
          message: "Failed to share content",
        });
      }
    } catch (error) {
      console.log(error);
      chrome.runtime.sendMessage({
        type: "error",
        message: "Failed to share content",
      });
    }
  };

  return (
    <>
      <h1 class="title">Share</h1>
      <form id="share-content" onSubmit={handleSubmit}>
        <input
          type="text"
          name="address"
          placeholder="metamask address"
          value={receiverAddress()}
          onChange={(e: Event) => {
            //@ts-ignore
            setReceiverAddress(e.target.value);
          }}
        />
        <button type="submit">Share</button>
      </form>
    </>
  );
}

render(App, document.getElementById("root")!);
