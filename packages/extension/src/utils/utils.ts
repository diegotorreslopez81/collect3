import { templateHtmlHead, templateHtmlMiddle, templateHtmlTail } from "./htmltemplate";

export type Article = {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
}

export type Metadata = {
  title: string;
  length: number; //duration in minutes
  excerpt: string; //description or extraction of the article
  byline: string; //author
  dir: string;
  siteName: string;
  lang: string;
  cid?: string;
}

export type Storage = {
  alias: string;
  url: string;
  deleted: boolean;
  shouldSync?: boolean;
  auth_token?: string;
  storageType: string;
}

export const ACTIVE_STORAGE = 'active_storage';
export const STORAGE_OPTIONS = 'storage_options';
export const DEFAULT_API = process.env.DEFAULT_STORAGE_API;
export const DEFAULT = 'default'
export const ID_KEY = 'UID_KEY';

export async function openPreview(path: string): Promise<chrome.tabs.Tab> {
  let url = chrome.runtime.getURL('preview.html');
  url += `?url=${encodeURIComponent(path)}`
  return await chrome.tabs.create({ url, });
}
export async function openPage(file: string): Promise<chrome.tabs.Tab> {
  let url = chrome.runtime.getURL(file);
  return await chrome.tabs.create({ url, });
}

export const toDataURL = async (url: string) => {
  return await fetch(url)
    .then(response => response.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }))
}

export const encodeDocumentImages = async (documentClone: Document | HTMLDivElement) => {
  const images = documentClone.querySelectorAll("img")
  for (let i = 0; i < images.length; i++) {
    const node = images[i];
    let src = node.src;
    if (src) {
      try {
        const newUrl = await toDataURL(src);
        node.src = newUrl as string;
        node.removeAttribute("srcset");
      } catch (err) {
        console.error("error: ", err);
      }
    }
  }
};

export const isBase64 = (base64: string) => {
  let result = true;
  try {
    atob(base64);
  } catch (err) {
    result = false;
  }
  return result;
};

export function articleContentToHtml(content: string, title: string, byline: string): string {
  const html = `
    ${templateHtmlHead}
      <h1 class="__reading__mode__extracted__title c0011" id="mainContentTitle" >
        ${title}
      </h1>
      <p>
        by <span class="author byline">${byline}</span>
      </p>
    ${templateHtmlMiddle}
      ${content}
    ${templateHtmlTail}
  `;
  return html;
}
