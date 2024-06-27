'use strict';
import { JSX, onMount } from "solid-js";
import { render } from "solid-js/web";

import './popup.css';
import { openPreview, openPage, articleContentToHtml, Article, connectToMetamask } from '../../utils/utils';
import { getActiveStorage, saveArticle, setToStorage } from '../../utils/storage';
import { getLightHouseJWT, getUserUid } from '../../utils/backend';
import { generate } from 'lighthouse-encryption-sdk-browser';
import { encryptFile } from 'lighthouse-package-fork/dist/Lighthouse/uploadEncrypted/encryptionBrowser';
import { KeyShard } from 'lighthouse-encryption-sdk-browser/dist/types';
import Base64 from '../../utils/Base64';

async function collect() {
  try {
    console.log("collect");
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      const response: { url: string, article: Article } = await chrome.tabs.sendMessage(
        tabs[0]?.id,
        { type: "getHtml" },
      );
      console.log("response", response);
      if (response === undefined) {
        chrome.notifications.create("", {
          iconUrl: '../../../public/icon_128.png',
          type: 'basic',
          message: 'Collecting Article',
          title: 'Info',
        })
        console.warn("failed to get article content");
        return undefined;
      }
      chrome.notifications.create("", {
        iconUrl: '../../../public/icon_128.png',
        type: 'basic',
        message: 'Saving Article Locally',
        title: 'Info',
      })
      const activeStorage = await getActiveStorage();

      let encryptParams: {
        uid: string,
        address: string,
        jwt: string,
        fileEncryptionKey: string,
        keyShards: KeyShard[],
        encryptedData: Uint8Array,
      } | undefined = undefined;
      const encodedArticleContent = Base64.encode(response.article.content);
      if (activeStorage.storageType === 'fvmEncrypted') {
        const rawContent = {
          ...response.article,
          textContent: undefined,
          url: response.url,
          content: encodedArticleContent,
        };
        const content = JSON.stringify(rawContent);
        console.log('fvmEncrypted')
        const signer = await connectToMetamask();
        const jwt = await getLightHouseJWT(signer);
        const uid = await getUserUid();

        const { masterKey: fileEncryptionKey, keyShards } = await generate();
        const encoder = new TextEncoder()
        const encryptedData = await encryptFile(encoder.encode(content).buffer, fileEncryptionKey);
        encryptParams = {
          uid,
          address: await signer.getAddress(),
          jwt,
          fileEncryptionKey: fileEncryptionKey || '',
          keyShards,
          encryptedData: encryptedData,
        }
        console.table(encryptParams)
      }
      await saveArticle(response.url, response.article, encodedArticleContent, encryptParams);
      await openPreview(response.url);
    }
  } catch (error) {
    console.error("Error in collect function:", error);
  }
}

async function preview() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      const response: { article: Article } = await chrome.tabs.sendMessage(
        tabs[0]?.id,
        { type: "getHtml" },
      );
      if (response === undefined) {
        console.warn("failed to get article content");
        chrome.notifications.create("", {
          iconUrl: '../../../public/icon_128.png',
          type: 'basic',
          message: 'Failed To Create Preview',
          title: 'Error',
        })
        return undefined;
      }
      const key = 'preview';
      const content = articleContentToHtml(
        response.article!.content,
        response.article!.title,
        response.article!.byline,
      );
      await setToStorage(
        key,
        content,
      );
      await openPreview(key);
    }
  } catch (error) {
    console.error("Error in preview function:", error);
    chrome.notifications.create("", {
      iconUrl: '../../../public/icon_128.png',
      type: 'basic',
      message: 'Failed To Create Preview',
      title: 'Error',
    })
  }
}

async function manageArticles() {
  try {
    await openPage('src/pages/articles/articles.html');
  } catch (error) {
    console.error("Error in manageArticles function:", error);
  }
}

async function manageStorage() {
  try {
    await openPage('src/pages/storage/storage.html');
  } catch (error) {
    console.error("Error in manageArticles function:", error);
  }
}

async function manageShared() {
  try {
    await openPage('src/pages/received/received.html');
  } catch (error) {
    console.error("Error in manageArticles function:", error);
  }
};

export function App(): JSX.Element {

  onMount(() => {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (details.previousVersion === "0.0.1") {
          chrome.runtime.sendMessage({ type: 'toBase64' });
        }
      }
    });

    chrome.runtime.sendMessage({ type: 'createAccount' });
    chrome.runtime.sendMessage({ type: 'syncStorage' });
  });

  return (
    <>
      <img src="../../../public/icon_128.png" alt="logo" />
      <div class="button-container">
        <button
          id="previewBtn"
          class="button"
          onClick={preview}
        >
          Preview
        </button>
        <button
          onClick={collect}
          id="collectBtn"
          class="button"
        >
          Collect
        </button>
      </div>
      <div class="button-container">
        <button
          id="manageBtn"
          class="button"
          onClick={manageArticles}
        >
          My Articles
        </button>
        <button
          id="storageBtn"
          class="button"
          onClick={manageStorage}
        >
          My Storage
        </button>
      </div>

      <div class="button-container">
        <button
          id="ShareBtn"
          class="button"
          onClick={manageShared}
        >
          Shared Content
        </button>
      </div>
    </>
  );
}

render(App, document.getElementById("root")!);
