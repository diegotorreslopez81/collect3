import { getActiveStorage, getFromStorage, setArticleCID, setAuthToken, setToStorage } from './storage';
import { ID_KEY, Metadata, Storage } from './utils';

export const getUserUid = async (): Promise<string> => {
  let id = await getFromStorage(ID_KEY);
  return id;
};

export const ping = async (activeStorage: Storage): Promise<string> => {
  const raw = await fetch(`${activeStorage?.url}ping`);
  return await raw.text();
};

export const isStorageAvailable = async (activeStorage: Storage): Promise<string> => {
  const raw = await fetch(`${activeStorage?.url}${activeStorage?.storageType}/available`);
  return await raw.text();
};

export const accountExist = async (uid: string, activeStorage: Storage): Promise<boolean> => {
  const raw = await fetch(`${activeStorage?.url}account_exist`, {
    method: 'POST',
    body: JSON.stringify({
      uid,
    }),
  });
  const response: { exist: boolean } = await raw.json();
  return response.exist;
};

export const createAccount = async (activeStorage?: Storage, userUID?: string) => {
  let uid: string;
  if (userUID) {
    uid = userUID;
  } else {
    uid = await getUserUid();
  }
  let storage: Storage;
  if (activeStorage) {
    storage = activeStorage;
  } else {
    storage = await getActiveStorage();
  }
  const raw = await fetch(`${activeStorage?.url}create_account`, {
    method: "POST",
    body: JSON.stringify({
      uid,
    }),
  });
  const response: { id: string, auth_token: string } = await raw.json();
  await setAuthToken(storage, response.auth_token);
  return response;
}

export const createToken = async (activeStorage?: Storage, userUID?: string) => {
  let uid: string;
  if (userUID) {
    uid = userUID;
  } else {
    uid = await getUserUid();
  }
  let storage: Storage;
  if (activeStorage) {
    storage = activeStorage;
  } else {
    storage = await getActiveStorage();
  }
  const raw = await fetch(`${storage.url}create_token`, {
    method: "POST",
    body: JSON.stringify({
      uid,
    }),
  });
  const response: { auth_token: string } = await raw.json();
  await setAuthToken(storage, response.auth_token);
  return response;
}

export const getOrCreateToken = async (activeStorage: Storage): Promise<string> => {
  const uid = await getUserUid();
  let auth_token: string;
  const exist = await accountExist(uid, activeStorage);
  if (exist) {
    const result = await createToken(activeStorage, uid)
    auth_token = result.auth_token;
  } else {
    const result = await createAccount(activeStorage);
    auth_token = result.auth_token;
  }
  return auth_token;
};

export const uploadFile = async (id: string, file: string, metadata: Metadata, activeStorage?: Storage) => {
  const uid = await getUserUid();
  let storage: Storage;
  if (activeStorage) {
    storage = activeStorage;
  } else {
    storage = await getActiveStorage();
  }

  let auth_token: string
  if (!storage.auth_token) {
    auth_token = await getOrCreateToken(storage);
  } else {
    auth_token = storage.auth_token;
  }
  const content = {
    ...metadata,
    cid: undefined,
    url: id,
    content: file,
  }
  const raw = await fetch(`${storage.url}${storage.storageType}/upload`, {
    method: "POST",
    body: JSON.stringify({
      file: JSON.stringify(content),
      auth_token,
      uid,
    }),
  });
  if (raw.status === 401) {
    throw new Error("Invalid Token");
  }
  if (raw.status !== 200) {
    throw new Error("Something Went Wrong");
  }
  const response: { cid: string } = await raw.json()
  setArticleCID(response.cid, id);
  return response;
};

export const downloadFile = async (cid: string, activeStorage?: Storage) => {
  let storage: Storage;
  if (activeStorage) {
    storage = activeStorage;
  } else {
    storage = await getActiveStorage();
  }
  let auth_token: string
  if (!storage.auth_token) {
    auth_token = await getOrCreateToken(storage);
  } else {
    auth_token = storage.auth_token;
  }
  const raw = await fetch(`${storage.url}${storage.storageType}/download`, {
    method: "POST",
    body: JSON.stringify({
      cid,
      auth_token,
    }),
  });
  if (raw.status === 401) {
    throw new Error("Invalid Token");
  }
  if (raw.status !== 200) {
    throw new Error("Something Went Wrong");
  }
  return await (await (raw.blob())).text();
};
