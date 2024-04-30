import { headtag } from "./htmlheadtag";

export const templateHtmlMiddle = `
              </div>
            </div>
            <div class="__reading__mode__mainbody" id="__reading__mode__mainbody__id">
              <div class="__reading__mode__extracted__article__body" id="mainContainer">
                <div>
                  <div class="entry-content">
`;
export const templateHtmlTail = `
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
`;

export const templateHtmlHead = `
  <html>
    ${headtag}
    <body>
      <div class="sticky">
        <button class="button" id="changeBackgroundButton-white">
          <i class="fa fa-sun"></i>
        </button>
        <button class="button" id="changeBackgroundButton-black">
          <i class="fa fa-moon"></i>
        </button>
        <button class="button" id="changeBackgroundButton-sepia">
          <i class="fa-regular fa-sun"></i>
        </button>
        <button class="button" id="changeFontSizeButton-plus">
          <i class="fa-solid fa-font"></i> +
        </button>
        <button class="button" id="changeFontSizeButton-minus">
          <i class="fa-solid fa-font"></i> -
        </button>
        <select id="fontSelector" class="select">
          <option value="Georgia">Georgia</option>
          <option value="Helvetica">Helvetica</option>
          <option value="PT Sans, PT Serif">PT Sans & PT Serif</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Roboto">Roboto</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>
      <main>
        <div id="__reading__mode__content_container">
          <div
            id="contentContainer"
            class="contentBody ms-column-type-narrow"
            role="main"
          >
            <div class="header_container" id="__reading__mode__header__container">
              <div class="header_content" id="header_content_id">
`
