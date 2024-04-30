export const headtag = `
    <head>
      <base id="content_base" target="_top">
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans|Roboto|PT+Sans|PT+Serif|Georgia|Helvetica|Verdana&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
      />
      <style id="content_document_stylesheet">
        body {
          margin: 0 auto;
          line-height: 1.1;
          max-width: 60%;

          font-size: 150%;
          font-family: Arial, sans-serif;
          /* Ensures text is legible */
        }

        p {
          line-height: 1.35;
        }

        /* https://alistapart.com/article/axiomatic-css-and-lobotomized-owls/ */
        *+* {
          margin-top: 1.2em;
        }

        /* Heading Hierarchy */
        h1 {
          font-size: 48px;
        }

        h2 {
          font-size: 42px;
        }

        h3 {
          font-size: 36px;
        }

        h4 {
          font-size: 30px;
        }

        h5 {
          font-size: 24px;
        }

        p {
          font-size: 22px;
        }

        li {
          font-size: 22px;
        }

        /* Links */
        a {
          color: #7200f5;
          text-decoration: underline;
        }

        a:visited {
          color: hsl(268, 100%, 74%);
        }

        .white-bg {
          background-color: white;
          color: black;
        }

        .black-bg {
          background-color: #363839;
          color: #d1cec9;
        }

        .sepia-bg {
          background-color: #f4ecd8;
          color: #4f4e4c;
        }

        .button {
          background-color: #5100ff;
          /* Green background */
          color: white;
          /* White text */
          padding: 10px 20px;
          /* Padding around text */
          border: none;
          /* No borders */
          border-radius: 5px;
          /* Rounded corners */
          cursor: pointer;
          /* Pointer cursor on hover */
          margin: 5px;
          /* Margin around buttons */
          transition: background-color 0.3s;
          /* Smooth transition for hover effect */
          font-family: Arial, sans-serif;
          /* Font style */
        }

        .button:hover {
          background-color: #260471;
          /* Darker shade of green on hover */
        }

        .select {
          padding: 10px 20px;
          /* Padding to match button */
          border-radius: 5px;
          /* Rounded corners */
          margin: 5px;
          /* Margin to match button */
          cursor: pointer;
          /* Pointer cursor */
          font-family: Arial, sans-serif;
          /* Font style */
        }

        /* Icons in buttons */
        .fa {
          margin-right: 8px;
          /* Space between icon and text */
        }

        .dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          background-color: #260471;
          color: white;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
          padding: 12px 16px;
          z-index: 1;
        }

        .dropdown:hover .dropdown-content {
          display: block;
        }

        .sticky {
          position: fixed;
          top: 0;
          width: 100%;
        }
        main {
          width: 100%;
          margin-top: 50px;
        }
        #changeBackgroundButton-white {
          padding-right: 9px;
        }
        #changeBackgroundButton-black {
          padding-right: 9px;
        }
        </style>
      </head>
`;
