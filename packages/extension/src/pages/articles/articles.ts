import "./articles.css";
import { getArticles, deleteArticle, listenToStorage, getActiveStorage } from "../../utils/storage";
import { Metadata, Storage } from "../../utils/utils";

function articleToElement(key: string, article: Metadata, storage: Storage): HTMLLIElement {
  const displayMint = article.cid && process.env.DEFAULT_STORAGE_API === storage.url;
  const displayShare = article.cid && storage.storageType === "fvmEncrypted" && !article?.shared;
  console.table({
    displayMint,
    displayShare,
    Default: process.env.DEFAULT_STORAGE_API,
    Url: storage.url,
    cid: article.cid,
  })
  const element = `
    <div class="article-header">
      <h2>${article.title}</h2> ${article.byline ? `<span>by: ${article.byline}</span>` : ''}
    </div>
    <p>
      ${article.excerpt}
    </p>
    <div>
    <span>${article.length} ${article.length == 1 ? 'minute' : 'minutes'} to read</span>
    <span>in ${article.lang}</span>
    </div>
    <a href="${chrome.runtime.getURL('preview.html')}?url=${encodeURIComponent(key)}" target="_blank" class="main">Read Article</a>
    ${displayMint ? `
        <a
          href="${process.env.MINT_PAGE}${article.cid}?title=${encodeURIComponent(article.title)}&description=${encodeURIComponent(article.excerpt)}"
          target="_blank"
          class="main"
        >
          Mint
        </a>` : ''
    }
    ${displayShare ? `
        <a
          href="${chrome.runtime.getURL('share.html')}?cid=${encodeURIComponent(article.cid || '')}"
          target="_blank"
          class="main"
        >
          Share
        </a>` : ''
    }
    <button id="${key}" title="click to delete" aria-label="click to close">x</button>
  `;
  const root = document.createElement("li");
  root.innerHTML = element;
  root.id = key + '-root';
  return root;
}

function noElementMessage(container: Element) {
  const element = '<h1 class="text-center">No Articles To Display</h1>';
  const root = document.createElement("li");
  root.id = "no-element";
  root.innerHTML = element;
  container.appendChild(root);
}

getActiveStorage().then((storage) => {
  getArticles().then((articles) => {
    const container = document.querySelector(".fullclick");
    const articlesArray = Array.from(articles.entries());
    articlesArray.forEach(([key, metadata]) => {
      container?.appendChild(articleToElement(key, metadata, storage));
    });
    if (articlesArray.length) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        container?.addEventListener('click', e => {
          const target = e.target as Element;
          if (target.nodeName === 'BUTTON') {
            (target?.parentNode as Element).remove();
            deleteArticle(target.id);
          }
        });
      } else {
        container?.addEventListener('click', e => {
          const target = e.target as Element;
          if (target.nodeName === 'BUTTON') {
            (target?.parentNode as HTMLElement).style.transition = '1s';
            (target?.parentNode as Element).className = 'todelete';
            deleteArticle(target.id);
          }
        });
        container?.addEventListener('transitionend', e => {
          const target = e.target as Element;
          if (target.classList.contains('todelete')) {
            target.remove();
          }
        });
      }
    } else {
      if (container) noElementMessage(container);
    }
    listenToStorage((changes) => {
      for (let [key, { oldValue: oldRawValue, newValue: newRawValue }] of Object.entries(changes)) {
        if (key == (storage.url + storage.storageType)) {
          const oldValue = new Map(JSON.parse(oldRawValue)) as Map<string, Metadata>;
          const newValue = new Map(JSON.parse(newRawValue)) as Map<string, Metadata>;
          if (oldValue.size == 0) {
            const oldElement = container?.querySelector("#no-element");
            oldElement?.remove();
          }
          if (newValue.size == 0) {
            container!.innerHTML = "";
            noElementMessage(container as Element);
          } else if (oldValue.size < newValue.size) {
            newValue.forEach((value, key) => {
              if (!oldValue.has(key)) {
                container?.appendChild(articleToElement(key, value, storage));
              }
            });
          } else {
            oldValue.forEach((_, key) => {
              if (!newValue.has(key)) {
                const oldElement = document.querySelector(`#${key}-root`);
                oldElement?.remove();
              } else {
                console.log('newValue has key');
              }
            });
          }
        }
      }
    });
  });
});
