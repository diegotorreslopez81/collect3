import "./received.css";
import { getActiveStorage, getArticles, setArticleContent, setArticles } from "../../utils/storage";
import { connectToMetamask, Storage, Metadata } from "../../utils/utils";
import { decryptArticle, getUserUid } from "../../utils/backend";

let activeStorage: Storage;
let uid: string;
let reducedmotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function contentToElement(cid: string): HTMLLIElement {
  const element = `
    <div class="article-header">
      <h2>Received Article</h2>
    </div>
    <p>
      Article Cid: ${cid}
    </p>
    <button
      title="click here to receive the article"
      aria-label="click here to receive the article"
      id="${cid}--accept"
      class="main"
    >
      Accept Content
    </button>
    <button
      id="${cid}"
      class="delete-button"
      title="click to delete"
      aria-label="click to delete"
    >
      x
    </button>
  `;
  const root = document.createElement("li");
  root.innerHTML = element;
  root.id = cid + '-root';
  return root;
}

function noElementMessage(container: Element) {
  const element = '<h1 class="text-center">No New Received Articles</h1>';
  const root = document.createElement("li");
  root.id = "no-element";
  root.innerHTML = element;
  container.appendChild(root);
}

const deleteStorage = async (id: string) => {
  const cid = id.replace('-root', '');
  await fetch(`${activeStorage.url}share/${cid}/${uid}`, {
    method: "DELETE"
  });
};

let deleteButtonCallback: (e: Event) => Promise<void>;
if (reducedmotion) {
  deleteButtonCallback = async (e: Event) => {
    const target = e.target as Element;
    (target?.parentNode as Element).remove();
    await deleteStorage(target.id);
  }
} else {
  deleteButtonCallback = async (e: Event) => {
    const target = e.target as Element;
    (target?.parentNode as HTMLElement).style.transition = '1s';
    (target?.parentNode as Element).className = 'todelete';
    await deleteStorage(target.id);
  };
}

const makeAcceptShared = (container: Element | null, cid: string) => {
  return async () => {
    const node = container?.querySelector(`[id='${cid}-root']`);
    const child = node?.querySelector(':nth-child(3)');
    const newChild = document.createElement('span');
    newChild.textContent = "isActive";
    newChild.className = "isActive";
    child?.appendChild(newChild);
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
      await setArticles(url, metadata as Metadata, articles);
      await setArticleContent(
        url,
        content,
      );
    } catch (err) {
      console.log(err);
      return chrome.notifications.create("", {
        iconUrl: 'icons/icon_128.png',
        type: 'basic',
        message: 'Failed to decrypt article',
        title: 'Error',
      })
    }

    container?.remove();
  }
};

const getSharedSArticles = async (): Promise<any[]> => {
  activeStorage = await getActiveStorage();
  uid = await getUserUid();

  const rawrequeest = await fetch(`${activeStorage.url}share/${uid}`);
  const response = await rawrequeest.json();
  return response;
};

Promise.all([
  getSharedSArticles(),
  getArticles(),
]).then((
  [shared, articles]
) => {
  const container = document.querySelector(".fullclick");
  const cids = new Set();
  articles.forEach(
    (article) => {
      cids.add(article.cid);
    }
  );
  const elements: HTMLLIElement[] = [];
  shared.forEach((option) => {
    console.log(option);
    console.log(cids.has(option.Content_CID));
    console.log(cids);
    if (cids.has(option.Content_CID)) {
      return;
    } else {
      cids.add(option.Content_CID);
    }
    const element = contentToElement(option.Content_CID);
    container?.appendChild(element);
    elements.push(element);
  });
  if (elements.length) {
    if (!reducedmotion) {
      container?.addEventListener('transitionend', e => {
        const target = e.target as Element;
        if (target.classList.contains('todelete')) {
          target.remove();
        }
      });
    }
    elements.forEach((el, i) => {
      if (!el) {
        return el;
      }
      const makeMainButton = el.querySelector('.main');
      const deleteButton = el.querySelector('.delete-button');
      const content = shared[i];

      deleteButton?.addEventListener('click', deleteButtonCallback);
      makeMainButton?.addEventListener('click', makeAcceptShared(el, content.Content_CID));
    });
  } else {
    if (container) noElementMessage(container);
  }
});
