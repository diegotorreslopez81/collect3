import { KeyShard } from "lighthouse-encryption-sdk-browser/dist/types";
import {
  type Metadata,
  type Article,
  type Storage,
  ACTIVE_STORAGE,
  DEFAULT_API,
  DEFAULT,
  STORAGE_OPTIONS,
} from "./utils";

export async function getFromStorage(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function(result) {
      resolve(result[key]);
    });
  });
}

export async function setToStorage(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, function() {
      resolve(undefined);
    });
  });
}

export async function removeFromStorage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, function() {
      resolve(undefined);
    });
  });
}
async function initializeStorage() {
  const defaultStorage: Storage = {
    url: DEFAULT_API as string,
    alias: DEFAULT,
    deleted: false,
    shouldSync: false,
    storageType: 'sia',
  };
  await setToStorage(
    ACTIVE_STORAGE,
    JSON.stringify(
      defaultStorage,
    ),
  );
  delete defaultStorage.shouldSync;
  await setToStorage(
    STORAGE_OPTIONS,
    JSON.stringify(
      [defaultStorage],
    ),
  );
}

export async function getActiveStorage(): Promise<Storage> {
  let current = await getFromStorage(ACTIVE_STORAGE);
  if (!current) {
    await initializeStorage();
    return {
      url: DEFAULT_API as string,
      alias: DEFAULT,
      deleted: false,
      shouldSync: false,
      storageType: 'sia',
    };
  }
  let activeStorage: Storage = JSON.parse(current);
  return activeStorage;
}

export async function getStorageOptions(): Promise<Storage[]> {
  let rawOptions = await getFromStorage(STORAGE_OPTIONS);
  if (!rawOptions) {
    await initializeStorage();
    rawOptions = await getFromStorage(STORAGE_OPTIONS);
  }
  const options: Storage[] = JSON.parse(rawOptions);
  return options;
}

export async function createStorageOption(url: string, alias: string, storageType: string): Promise<boolean> {
  const options = await getStorageOptions();
  const exist = options.findIndex((s) => {
    const optionUrl = new URL(s.url);
    const newUrl = new URL(url);
    return optionUrl.host == newUrl.host && optionUrl.pathname == newUrl.pathname && s.storageType == storageType;
  });
  const newStorage: Storage = {
    url,
    alias,
    deleted: false,
    storageType,
  };
  if (exist === -1) {
    options.push(newStorage);
  } else {
    options[exist] = newStorage;
  }
  await setToStorage(
    STORAGE_OPTIONS,
    JSON.stringify(
      options,
    ),
  );
  return true;
}

export async function deleteStorageOption(url: string) {
  if (url === DEFAULT_API) {
    await changeActiveStorage(DEFAULT_API as string, 'sia', false);
    return;
  }
  const options = await getStorageOptions();
  const active = await getActiveStorage();

  const toDelete = options.findIndex((v) => {
    return v.url == url;
  });

  if (url === active.url) {
    await changeActiveStorage(DEFAULT_API as string, 'sia', false);
  }

  if (toDelete === -1) {
    return;
  }

  options[toDelete].deleted = true;

  await setToStorage(STORAGE_OPTIONS, JSON.stringify(options));
};

export async function changeActiveStorage(url: string, storageType: string, sync: boolean): Promise<void> {
  const options = await getStorageOptions();
  const exist = options.find((s) => {
    const optionUrl = new URL(s.url);
    const newUrl = new URL(url);
    return optionUrl.host == newUrl.host && optionUrl.pathname == newUrl.pathname && s.storageType == storageType;
  });

  if (!exist) {
    return;
  }

  exist.shouldSync = sync;
  await setToStorage(
    ACTIVE_STORAGE,
    JSON.stringify(
      exist,
    ),
  );
}

export async function setAuthToken(storage: Storage, auth_token: string): Promise<void> {
  const options = await getStorageOptions();
  const active = await getActiveStorage();
  const storageUrl = new URL(storage.url);
  const activeUrl = new URL(active.url);
  const index = options.findIndex((s) => {
    const optionUrl = new URL(s.url);
    return optionUrl.host == storageUrl.host && optionUrl.pathname == storageUrl.pathname && s.storageType == storage.storageType;
  });

  if (index === -1) {
    return;
  }

  if (activeUrl.host == storageUrl.host && activeUrl.pathname == storageUrl.pathname && active.storageType == storage.storageType) {
    await setToStorage(
      ACTIVE_STORAGE,
      JSON.stringify(
        {
          ...storage,
          auth_token
        },
      ),
    );
  }

  options[index].auth_token = auth_token;
  await setToStorage(
    STORAGE_OPTIONS,
    JSON.stringify(
      options,
    ),
  );
}

export async function getArticles(): Promise<Map<string, Metadata>> {
  const key = await getActiveStorage();
  let articles = await getFromStorage(key.url + key.storageType);
  if (!articles) {
    return new Map();
  } else {
    articles = new Map(JSON.parse(articles));
  }
  return articles;
}

export async function setArticles(url: string, data: Metadata, articles: Map<string, Metadata>) {
  const key = await getActiveStorage();
  if (articles.has(url)) {
    return
  }
  articles.set(url, data);
  await setToStorage(
    key.url + key.storageType,
    JSON.stringify(
      Array.from(
        articles.entries(),
      ),
    ),
  );
}

export async function setArticleCID(cid: string, url: string) {
  const key = await getActiveStorage();
  const articles = await getArticles();
  const data = articles.get(url);
  if (!data) {
    return
  }
  data!.cid = cid;
  articles.set(url, data);
  await setToStorage(
    key.url + key.storageType,
    JSON.stringify(
      Array.from(
        articles.entries(),
      ),
    ),
  );
}

export async function removeArticles(url: string): Promise<boolean> {
  const articles = await getArticles();
  const result = articles.delete(url);
  const key = await getActiveStorage();
  if (result) {
    await setToStorage(
      key.url + key.storageType,
      JSON.stringify(
        Array.from(
          articles.entries(),
        ),
      ),
    );
  }
  return result;
}

export async function getArticleContent(url: string): Promise<string> {
  return getFromStorage(url);
}

export async function setArticleContent(url: string, content: string): Promise<void> {
  const exist = await getArticleContent(url);
  if (!exist) {
    await setToStorage(url, content);
  }
}

export async function deleteArticleContent(url: string): Promise<void> {
  await removeFromStorage(url);
}

export async function saveArticle(
  url: string,
  article: Article,
  encodedArticleContent: string,
  encryptParams?: {
    uid: string,
    address: string,
    jwt: string,
    fileEncryptionKey: string,
    keyShards: KeyShard[],
    encryptedData: Uint8Array,
  },
): Promise<void> {
  const articles = await getArticles();
  const { content, textContent, ...metadata } = article;
  const numOfWords = textContent.split(' ').length;
  // 255 is the word per minute constant
  const wpm = 255;
  metadata.length = Math.ceil(numOfWords / wpm);
  if (articles.has(url)) {
    return;
  }
  await setArticles(url, metadata as Metadata, articles);
  await setArticleContent(
    url,
    encodedArticleContent,
  );

  const storage = await getActiveStorage();
  const payload: {
    url: string,
    encryptParams?: {
      uid: string,
      address: string,
      jwt: string,
      fileEncryptionKey: string,
      keyShards: KeyShard[],
      encryptedData: Uint8Array,
    }
  } = { url };
  if (storage.shouldSync) {
    console.log("encryptParams", encryptParams);
    if (encryptParams) {
      payload.encryptParams = encryptParams;
      console.log("syncEncrypt", payload);
      chrome.runtime.sendMessage({
        type: 'syncEncrypt',
        payload,
      });
    } else {
      chrome.runtime.sendMessage({
        type: 'sync',
        payload,
      });
    }
  }
}

export async function deleteArticle(url: string): Promise<void> {
  await removeArticles(url);
  await deleteArticleContent(url);
}

export function listenToStorage(
  cb: (changes: { [key: string]: chrome.storage.StorageChange; }) => void,
) {
  chrome.storage.local.onChanged.addListener(cb)
}
