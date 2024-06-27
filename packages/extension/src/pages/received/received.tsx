'use strict';
import { createResource, For, JSX, Setter } from "solid-js";
import { render } from "solid-js/web";

import "./received.css";
import { getActiveStorage, getArticles, setArticleContent, setArticles } from "../../utils/storage";
import { connectToMetamask, type Storage, type Metadata } from "../../utils/utils";
import { decryptArticle, getUserUid } from "../../utils/backend";

let activeStorage: Storage;
let uid: string;

function NoElementMessage() {
  return (
    <li id="no-element">
      <h1 class="text-center">
        No New Received Articles
      </h1>
    </li>
  );
}

const deleteStorage = async (cid: string) => {
  await fetch(`${activeStorage.url}share/${cid}/${uid}`, {
    method: "DELETE"
  });
};

function ReceivedElement(props: { cid: string, mutate: Setter<string[] | undefined> }) {
  const cid = props.cid;
  const mutate = props.mutate;

  async function deleteByCid() {
    await deleteStorage(cid);
    mutate((articles) => (articles?.filter((x) => x !== cid)));
  }

  async function acceptArticle() {
    try {
      const signer = await connectToMetamask()
      const blob: Blob = await decryptArticle(cid, signer);
      const plain = await blob.text();
      const parsed: Metadata & {
        url: string,
        content: string,
      } = JSON.parse(plain);

      const articles = await getArticles();
      const {
        url,
        content,
        ...metadata
      } = parsed;
      metadata.cid = cid;
      metadata.shared = true;
      await setArticles(url, metadata as Metadata, articles);
      await setArticleContent(
        url,
        content,
      );
      mutate((articles) => (articles?.filter((x) => x !== cid)));
    } catch (err) {
      console.log(err);
      return chrome.notifications.create("", {
        iconUrl: '../../../public/icon_128.png',
        type: 'basic',
        message: 'Failed to decrypt article',
        title: 'Error',
      })
    }
  };

  return (
    <li id={cid + '-root'}>
      <div class="article-header">
        <h2>Received Article</h2>
      </div>
      <p>
        Article Cid: {cid}
      </p>
      <button
        title="click here to receive the article"
        aria-label="click here to receive the article"
        id={cid + '--accept'}
        class="main"
        onClick={acceptArticle}
      >
        Accept Content
      </button>
      <button
        id={cid}
        class="delete-button"
        title="click to delete"
        aria-label="click to delete"
        onClick={deleteByCid}
      >
        x
      </button>
    </li>
  );
}

const getSharedSArticles = async (): Promise<string[]> => {
  activeStorage = await getActiveStorage();
  uid = await getUserUid();

  const rawrequeest = await fetch(`${activeStorage.url}share/${uid}`);
  const sharedArticles = await rawrequeest.json();

  const articles = await getArticles();
  const cids = new Set();
  articles.forEach(
    (article) => {
      cids.add(article.cid);
    }
  );

  const fillteredArticles: string[] = [];
  sharedArticles.forEach((option: any) => {
    if (cids.has(option.Content_CID)) {
      return;
    } else {
      cids.add(option.Content_CID);
    }
    fillteredArticles.push(option.Content_CID);
  });
  return fillteredArticles;
};

export function App(): JSX.Element {
  const [receivedArticles, { mutate }] = createResource(getSharedSArticles);

  return (
    <>
      <h1 class="title">Received Articles</h1>
      <ul class="fullclick">
        <For each={receivedArticles()} fallback={<NoElementMessage />}>
          {(cid) => (
            <ReceivedElement
              cid={cid}
              mutate={mutate}
            />
          )}
        </For>
      </ul>
    </>
  );
}

render(App, document.getElementById("root")!);
