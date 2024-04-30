import "./preview.css";
import { getArticleContent, getArticles } from "../../utils/storage";
import { articleContentToHtml, isBase64 } from "../../utils/utils";
import Base64 from "../../utils/Base64";

const params = new URLSearchParams(location.search);
const url = params.get('url');

function setControlsListeners(iframe: HTMLIFrameElement) {
  iframe.onload = function() {
    const body = iframe.contentDocument?.body;

    function changeBackground(color: 'white' | 'black' | 'sepia') {
      body?.classList.remove('white-bg', 'black-bg', 'sepia-bg'); // Remove all classes first
      switch (color) {
        case 'white':
          body?.classList.add('white-bg');
          break;
        case 'black':
          body?.classList.add('black-bg');
          break;
        case 'sepia':
          body?.classList.add('sepia-bg');
          break;
      }
    }

    function changeFontSize(direction: '+' | '-') {
      const paragraphs = body?.querySelectorAll('h1, h2, h3, h4, h5, p, li'); // Select all paragraphs within .content
      paragraphs?.forEach((paragraph) => {
        let currentSize = parseFloat(
          window.getComputedStyle(paragraph, null).getPropertyValue('font-size')
        );
        if (direction === '+') {
          currentSize += 2; // Increase font size by 2px
        } else if (direction === '-') {
          currentSize -= 2; // Decrease font size by 2px
        }
        // @ts-ignore
        paragraph.style.fontSize = currentSize + 'px'; // Apply the new font size
      });
      const main = body?.querySelector('main');
      if (!main) {
        return main;
      }
      let marginTop = parseFloat(
        window.getComputedStyle(main, null).getPropertyValue('margin-top')
      );
      if (marginTop === 0) {
        marginTop = 50;
      }
      const newSize = direction === '+' ? marginTop + 2 : marginTop - 2;
      main.style.marginTop = newSize + 'px';
    }

    const fontSelector = body?.querySelector('#fontSelector');

    fontSelector?.addEventListener('change', function(e) {
      // @ts-ignore
      body?.style.fontFamily = e.target.value;
    });

    const whiteButton = body?.querySelector('#changeBackgroundButton-white');
    const blackButton = body?.querySelector('#changeBackgroundButton-black');
    const sepiaButton = body?.querySelector('#changeBackgroundButton-sepia');

    whiteButton?.addEventListener('click', function() {
      changeBackground('white');
    });
    blackButton?.addEventListener('click', function() {
      changeBackground('black');
    });
    sepiaButton?.addEventListener('click', function() {
      changeBackground('sepia');
    });

    const plusButton = body?.querySelector('#changeFontSizeButton-plus');
    const minusButton = body?.querySelector('#changeFontSizeButton-minus');
    plusButton?.addEventListener('click', function() {
      changeFontSize('+');
    });
    minusButton?.addEventListener('click', function() {
      changeFontSize('-');
    });
  };
}

function setIframeData(data: string) {
  const iframeContainer = document.querySelector("body > div > div")
  const iframe = document.createElement("iframe");
  iframe.id = "collected-content";

  const blob = new Blob(
    [data],
    { type: "text/html" }
  );

  iframe.src = window.URL.createObjectURL(blob);

  iframeContainer!.innerHTML = "";
  iframeContainer!.appendChild(iframe);
  setControlsListeners(iframe);
}

Promise.all([
  getArticleContent(url as string),
  getArticles()
])
  .then(([article, ArticlesMetadata]) => {
    const metadata = ArticlesMetadata.get(url as string);
    let articleContent = article;
    const articleIsBase64 = isBase64(article);
    if (articleIsBase64) {
      const decodedContent = Base64.decode(article);
      articleContent = articleContentToHtml(
        decodedContent,
        metadata?.title || "",
        metadata?.byline || "",
      );
    }
    setIframeData(articleContent);
  });
