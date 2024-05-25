'use strict';

import { KeyShard } from "lighthouse-encryption-sdk-browser/dist/types";
import { encryptArticle, getOrCreateToken, uploadFile } from "./utils/backend";
import { fromHtmlToBase64, fromLocalOnlyToMultipleRemotes } from "./utils/migrations";
import { getActiveStorage, getArticleContent, getArticles, getFromStorage } from "./utils/storage";
import { Metadata } from "./utils/utils";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((
  request: { type: string, payload: any, },
  _,
  sendResponse,
) => {
  if (request.type === 'toBase64') {
    fromLocalOnlyToMultipleRemotes()
      .then(() => fromHtmlToBase64())
      .then(() => sendResponse({ message: 'Done' }))
      .catch(() => sendResponse({ message: 'Error' }));
  }
  if (request.type === 'sync') {
    const { url } = request.payload;
    const upload = async () => {
      try {
        chrome.notifications.create("", {
          iconUrl: 'icons/icon_128.png',
          type: 'basic',
          message: 'Saving Article In Server',
          title: 'Info',
        })
        const storage = await getActiveStorage();
        const articles = await getArticles();
        const file = await getArticleContent(url);
        const metadata = articles.get(url);

        let cid: string;
        try {
          const result = await uploadFile(url, file, metadata as Metadata, storage)
          cid = result.cid;
        } catch (err: any) {
          if (err.message === "Invalid Token") {
            await getOrCreateToken(storage);
            const result = await uploadFile(url, file, metadata as Metadata, storage)
            cid = result.cid;
          } else {
            throw err;
          }
        }

        sendResponse({
          message: 'Done',
          payload: {
            cid: cid,
          },
        })
      } catch (err: any) {
        chrome.notifications.create("", {
          iconUrl: 'icons/icon_128.png',
          type: 'basic',
          message: 'Failed To Save In Server',
          title: 'Info',
        })
        console.log(err);
        sendResponse({ message: 'Error' })
      }
    };
    upload();
  }
  if (request.type === 'syncStorage') {
    const upload = async () => {
      try {
        const storage = await getActiveStorage();
        if (!storage.shouldSync) {
          return;
        }
        if (storage.storageType === 'fvmEncrypted') {
          return;
        }
        const rawArticles = await getFromStorage(storage.url);
        const articles: [[string, Metadata]] = JSON.parse(rawArticles);
        const filteredArticles = articles.filter(([_, metadata]) => {
          return !metadata.cid;
        });
        for (let i = 0; i < filteredArticles.length; i++) {
          const [url, metadata] = filteredArticles[i];
          const file = await getArticleContent(url);
          await uploadFile(url, file, metadata as Metadata, storage);
        }
        sendResponse({ message: 'Done' })
      } catch (err) {
        console.log(err);
        sendResponse({ message: 'Error' })
      }
    };
    upload();
  }
  if (request.type === 'createAccount') {
    const create = async () => {
      try {
        const storage = await getActiveStorage();
        if (storage.shouldSync && !storage.auth_token) {
          const token = await getOrCreateToken(storage);
          sendResponse({
            message: 'Done',
            payload: {
              token,
            },
          })
          return;
        }
        sendResponse({ message: 'Done' })
      } catch (err) {
        console.log(err);
        sendResponse({ message: 'Error' })
      }
    };
    create()
  }
  if (request.type === 'syncEncrypt') {
    const upload = async () => {
      const { url } = request.payload;
      const encryptParams: {
        uid: string,
        address: string,
        jwt: string,
        fileEncryptionKey: string,
        keyShards: KeyShard[],
        encryptedData: {
          [key: string]: string
        },
      } = request.payload.encryptParams;
      const storage = await getActiveStorage();
      let cid: string;
      try {
        const result = await encryptArticle(storage, url, encryptParams);
        cid = result.cid;
      } catch (err: any) {
        if (err.message === "Invalid Token") {
          await getOrCreateToken(storage);
          const result = await encryptArticle(storage, url, encryptParams);
          cid = result.cid;
        } else {
          throw err;
        }
      }

      sendResponse({
        message: 'Done',
        payload: {
          cid: cid,
        },
      })
    };
    console.log("encryptArticle");
    upload();
  }
  if (request.type === 'syncStorageEncrypted') {
    const upload = async () => {
      try {
        const storage = await getActiveStorage();
        if (!storage.shouldSync) {
          return;
        }
        if (storage.storageType !== 'fvmEncrypted') {
          return;
        }
        // TODO: change all of this
        // pull from the server all the cids
        // check if the cids exist in local
        // if not download all
        const rawArticles = await getFromStorage(storage.url);
        const articles: [[string, Metadata]] = JSON.parse(rawArticles);
        const filteredArticles = articles.filter(([_, metadata]) => {
          return !metadata.cid;
        });
        for (let i = 0; i < filteredArticles.length; i++) {
          const [url, metadata] = filteredArticles[i];
          const file = await getArticleContent(url);
          await uploadFile(url, file, metadata as Metadata, storage);
        }
        sendResponse({ message: 'Done' })
      } catch (err) {
        console.log(err);
        sendResponse({ message: 'Error' })
      }
    };
    upload();
  }
  return true;
});
