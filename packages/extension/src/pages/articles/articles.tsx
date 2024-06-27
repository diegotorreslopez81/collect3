'use strict';
import { createResource, For as Index, JSX, Setter, Show } from "solid-js";
import { render } from "solid-js/web";
import "./articles.css";
import { getArticles, deleteArticle, listenToStorage, getActiveStorage } from "../../utils/storage";
import { Metadata } from "../../utils/utils";

function NoElementMessage() {
  return (
    <li id="no-element">
      <h1 class="text-center">No Articles To Display</h1>
    </li>
  );
}

function ArticleElement(
  props: {
    key: string,
    displayShare: boolean,
    displayMint: boolean,
    article: Metadata
    setArticles: Setter<[string, Metadata][] | undefined>,
  }) {
  let ref!: HTMLLIElement;
  const key = () => props.key;
  const displayShare = () => props.displayShare;
  const displayMint = () => props.displayMint;
  const article = () => props.article;
  const timeToRead = `${article().length} ${article().length == 1 ? 'minute' : 'minutes'} to read `;
  const linkToRead = `${chrome.runtime.getURL('src/pages/preview/preview.html')}?url=${encodeURIComponent(key())}`;
  // @ts-ignore
  const mintLink = (import.meta.env.VITE_MINT_PAGE || '') + article().cid + "?title=" +
    encodeURIComponent(article().title) + "&description=" + encodeURIComponent(article().excerpt);
  const shareLink = chrome.runtime.getURL('src/pages/share/share.html') + "?cid=" + encodeURIComponent(article().cid || '')

  const handleClick = () => {
    deleteArticle(key());
    props.setArticles((articles) => {
      return articles?.filter((x) => x[0] !== key())
    });
  };

  return (
    <li ref={ref} id={`${key()}-root`}>
      <div class="article-header">
        <Show
          when={Boolean(article().byline)}
          fallback={<h2>{article().title}</h2>}
        >
          <h2>{article().title}</h2> <span>by: {article().byline}</span>
        </Show>
      </div>
      <p>
        ${article().excerpt}
      </p>
      <div>
        <span>{timeToRead}</span>
        <span>in {article().lang}</span>
      </div>
      <a href={linkToRead} target="_blank" class="main">Read Article</a>
      <Show when={displayMint()}>
        <a
          href={mintLink}
          target="_blank"
          class="main"
        >
          Mint
        </a>
      </Show>
      <Show when={displayShare()}>
        <a
          href={shareLink}
          target="_blank"
          class="main"
        >
          Share
        </a>
      </Show>
      <button
        id={key()}
        title="click to delete"
        aria-label="click to close"
        onClick={handleClick}
      >
        x
      </button>
    </li>
  );
}

async function fetchArticlesData() {
  const articles = await getArticles();
  const articlesArray = Array.from(articles.entries());
  return articlesArray;
}


export function App(): JSX.Element {
  const [storage] = createResource(getActiveStorage);
  const [articles, { mutate, refetch }] = createResource(fetchArticlesData);

  listenToStorage((changes) => {
    for (let [key, _] of Object.entries(changes)) {
      if (key == (storage()?.url + storage()!.storageType)) {
        refetch()
      }
    }
  });

  return (
    <>
      <Index each={articles()} fallback={<NoElementMessage />}>
        {(item: [string, Metadata]) => (
          <ArticleElement
            setArticles={mutate}
            key={item[0]}
            article={item[1]}
            displayMint={Boolean(
              item[1].cid && //@ts-ignore
              import.meta.env.VITE_DEFAULT_STORAGE_API === storage()?.url
            )}
            displayShare={Boolean(
              item[1].cid &&
              storage()?.storageType === "fvmEncrypted" &&
              !item[1]?.shared
            )}
          />
        )}
      </Index>
    </>
  );
}

render(App, document.getElementById("root")!);
