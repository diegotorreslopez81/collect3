import { getAuthMessage, getJWT, saveShards } from 'lighthouse-encryption-sdk-browser';
import { decryptFile, fetchEncryptionKey, shareFile } from 'lighthouse-package-fork';
import { Signer } from 'ethers';
import { getActiveStorage, getFromStorage, setArticleCID, setAuthToken } from './storage';
import { ID_KEY, Metadata, Storage } from './utils';
import { KeyShard } from 'lighthouse-encryption-sdk-browser/dist/types';

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

export const getLightHouseJWT = async (signer: Signer): Promise<string> => {
  const authMessage = await getAuthMessage(await signer.getAddress())
  if (!authMessage?.message) {
    throw new Error("Failed to get auth message")
  }
  const signedMessage = await signer.signMessage(authMessage.message)
  const { JWT, error } = await getJWT(await signer.getAddress(), signedMessage)
  return JWT;
};

export const encryptArticle = async (
  storage: Storage,
  url: string,
  params: {
    uid: string,
    address: string,
    jwt: string,
    keyShards: KeyShard[],
    encryptedData: {
      [key: string]: string
    },
  }
) => {
  const { uid, address, jwt: auth_token, keyShards, encryptedData } = params
  console.table(params);

  if (auth_token.startsWith("0x")) {
    throw new Error(JSON.stringify(`auth_token must be a JWT`));
  }

  const keys = Object.keys(encryptedData);
  const parsed = new Uint8Array(keys.length);

  for (let i = 0; i < keys.length; i++) {
    const byte = encryptedData[i];
    parsed[i] = parseInt(byte);
  }

  const data = new FormData()
  const buff = new Blob([parsed], { type: "text/plain" })
  console.log("encryptedData: ", encryptedData);
  console.log("buff", buff);
  data.append("file", buff, "article.txt")
  data.append("auth_token", auth_token)
  data.append("uid", uid)

  const rawresponse = await fetch(`${storage.url}uploadEncrypted`, {
    method: 'POST',
    body: data,
  });

  if (rawresponse.status === 401) {
    throw new Error("Invalid Token");
  }
  if (rawresponse.status !== 200) {
    throw new Error("Something Went Wrong");
  }

  let response = await rawresponse.json();
  console.log(response);

  const savedKey = await saveShards(
    address,
    response.cid,
    auth_token,
    keyShards
  );

  if (!savedKey.isSuccess) {
    throw new Error(JSON.stringify(savedKey));
  }

  console.log(
    `Decrypt at https://decrypt.mesh3.network/evm/${response.cid}`
  );

  await setArticleCID(response.cid, url);

  // return response
  /*
    {
      cid: 'QmUHDKv3NNL1mrg4NTW4WwJqetzwZbGNitdjr2G6Z5Xe6s',
      name: 'article.json',
    }
  */
  return response;
}

export const encryptionSignature = async (signer: Signer) => {
  const address = await signer.getAddress();
  const messageRequested = (await getAuthMessage(address)).message;
  if (!messageRequested) {
    throw new Error("Failed to get auth message");
  }
  const signedMessage = await signer.signMessage(messageRequested);
  return ({
    signedMessage,
    address,
  });
}

export const decryptArticle = async (cid: string, signer: Signer) => {
  // const cid = "QmVkbVeTGA7RHgvdt31H3ax1gW3pLi9JfW6i9hDdxTmcGK"; //replace with your IPFS CID
  const { address, signedMessage } = await encryptionSignature(signer);
  /*
    fetchEncryptionKey(cid, publicKey, signedMessage)
      Parameters:
        CID: CID of the file to decrypt
        publicKey: public key of the user who has access to file or owner
        signedMessage: message signed by the owner of publicKey
  */
  const keyObject = await fetchEncryptionKey(
    cid,
    address,
    signedMessage
  );

  if (!keyObject?.data?.key) {
    console.log("keyObject", keyObject);
    throw new Error(JSON.stringify(keyObject));
  }
  // Decrypt file
  /*
    decryptFile(cid, key, mimeType)
      Parameters:
        CID: CID of the file to decrypt
        key: the key to decrypt the file
        mimeType: default null, mime type of file
  */

  const fileType = "text/plain";
  const decrypted = await decryptFile(cid, keyObject.data.key, fileType);
  console.log("decrypted", decrypted);
  /*
    Response: blob
  */
  return decrypted;
}

export const shareEncrypted = async (cid: string, signer: Signer, targetAddress: string[]) => {
  try {
    const signedMessage = await getLightHouseJWT(signer);
    const address = await signer.getAddress();

    const shareResponse = await shareFile(
      address,
      targetAddress,
      cid,
      signedMessage
    );
    console.log(shareResponse)
    /* Sample Response
      {
        data: {
          cid: 'QmTsC1UxihvZYBcrA36DGpikiyR8ShosCcygKojHVdjpGd',
          shareTo: [ '0x487fc2fE07c593EAb555729c3DD6dF85020B5160' ],
          status: 'Success'
        }
      }
    */
    return shareResponse;
  } catch (error) {
    console.log(error);
  }
}
