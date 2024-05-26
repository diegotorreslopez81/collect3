import "./share.css";
import { getAddress } from "ethers";
import { getUserUid, shareEncrypted } from "../../utils/backend";
import { connectToMetamask } from "../../utils/utils";
import { getActiveStorage } from "../../utils/storage";

const params = new URLSearchParams(location.search);
const cid = params.get('cid');

const form: HTMLFormElement | null = document.querySelector("#share-content");
if (form) {
  form.addEventListener('submit', async function(e: Event) {
    e.preventDefault()
    const addressInput: HTMLInputElement | null = form[0] as HTMLInputElement;
    const storage = await getActiveStorage();
    const value = addressInput.value.trim();
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
          address,
          cid,
        }),
      });
      console.log(response);
      if (response?.data.status?.toLowerCase() === 'success') {
        chrome.runtime.sendMessage({
          type: "success",
          message: "content shared successfully",
        });
        addressInput.value = '';
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
  });
}
