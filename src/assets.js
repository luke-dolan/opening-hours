export const styles = `
    .widget__container * {
        box-sizing: border-box;
    }        
    h3, p, input {
        margin: 0;
        padding: 0;
    }
    .widget__container {
        // box-shadow: 0 0 18px 8px rgba(0, 0, 0, 0.1), 0 0 32px 32px rgba(0, 0, 0, 0.08);
        width: 100%;
        overflow: auto;
        position: absolute;
        transition: max-height .2s ease;
        font-family: Helvetica, Arial ,sans-serif;
        background-color: #fff;
        border-radius: 4px;
        box-sizing: border-box;
        padding: 15px;
        background-color: #fff;
    }
    .widget__icon {
        cursor: pointer;
        width: 60%;
        position: absolute;
        top: 18px;
        left: 16px;
        transition: transform .3s ease;
    }
    .widget__hidden {
        transform: scale(0);
    }
    .ucd-library-homepage-hours {
        color: #004377;
        border-collapse: collapse;
        border-spacing: 0;
        width: 100%;
        margin-bottom: 20px;
        font-family: Lato, sans-serif;
        font-size: 16px;

        td {
          padding: 5px 10px;
          font-weight: bold;

          &:last-child {
            color: #03884a;
          }
        }

        tr {
          &:not(:last-child) {
            td {
              border-bottom: 1px solid #ddd;
            }
          }
        }

      
    }

    .button {
          background: #666;
          padding: 10px;
          display: block;
          margin: 15px 0;
          text-align: center;
          color: #fff;
          font-weight: bold;
          transition: all 300ms ease;
          font-family: Lato, sans-serif;
          font-size: 16px;

          &:hover {
            color: #004377;
          }

          &:first-of-type {
            background-color: #004377;

             &:hover {
              background-color: #fad239;
            }
          }

          &:last-of-type {
            background-color: #03884a;

            &:hover {
              background-color: #fad239;
            }
          }
      }
`;