'use strict';
import readability from '@mozilla/readability';
import { Article, encodeDocumentImages } from './utils/utils';
// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

async function getCleanedHtml(): Promise<Article | undefined> {
  try {
    const documentClone = document.cloneNode(true) as Document;
    await encodeDocumentImages(documentClone);
    const article = new readability.Readability(documentClone).parse();
    return article || undefined;
  } catch (error) {
    console.warn('Error parsing document, sending original content');
    console.warn(error);
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'getHtml') {
    getCleanedHtml().then((data) => {
      let response = {
        article: data,
        url: window.location.protocol + '//' + window.location.host + window.location.pathname,
      }
      sendResponse(response);
    });
  }
  return true;
});
