// main.js
import { styles } from "./assets.js";
import "./opening-hours.js";
import $ from "jquery";
window.$ = $;
window.jQuery = $;

// Define the responsiveTable jQuery plugin here
$.fn.responsiveTable = function () {
  $(this)
    .find("table:not(.responsiveTableProcessed)")
    .each(function () {
      var e = $(this).find("tr").not("tr:first-child"),
        t = [];
      $(this)
        .find("tr:first-child td, tr:first-child th")
        .each(function () {
          (headLines = $(this).text()), t.push(headLines);
        }),
        e.each(function () {
          for (i = 0, l = t.length; i < l; i++)
            $(this)
              .find("td")
              .eq(i + 1)
              .prepend("<h3>" + t[i + 1] + "</h3>");
        }),
        e.append('<i class="icon-accordion">+</i>'),
        e.click(function () {
          $(this).hasClass("accordion-opened") && $(document).outerWidth() < 992
            ? $(this)
                .animate(
                  {
                    maxHeight: "60px",
                  },
                  200
                )
                .removeClass("accordion-opened")
                .find(".icon-accordion")
                .text("+")
            : $(document).outerWidth() < 992 &&
              $(this)
                .animate(
                  {
                    maxHeight: "1000px",
                  },
                  400
                )
                .addClass("accordion-opened")
                .find(".icon-accordion")
                .text("-");
        }),
        $(this).addClass("responsiveTableProcessed");
    });
};

class HoursWidget {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.initialize();
  }

  widgetContainer = null;

  async initialize() {
    console.log("HoursWidget initialize() called");
    if (!this.targetElement) {
      console.error("Target element with class 'widget__container' not found.");
      return;
    }

    this.widgetContainer = this.targetElement;

    console.log("About to call createWidgetContent()");
    this.createWidgetContent();
    console.log("createWidgetContent() finished");

    this.injectStyles(this.widgetContainer);

    const $table = $(this.widgetContainer).find(
      "table.ucd-library-homepage-hours"
    );
    console.log("$table found immediately:", $table);
    if ($table.length > 0) {
      setTimeout(() => {
          this.applyOpeningHoursPluginNow($table);
      }, 50); // Small delay in milliseconds
  }

    // We might not need the MutationObserver anymore in this direct approach
    // If you anticipate further dynamic table updates, you might keep it.
    // For now, let's comment it out.
    // const observer = new MutationObserver((mutationsList, observer) => {
    //     console.log('MutationObserver callback triggered!');
    //     console.log('Mutations:', mutationsList);
    //     const $table = $(this.widgetContainer).find("table.ucd-library-homepage-hours");
    //     console.log('$table found (inside observer):', $table);
    //     if ($table.length > 0) {
    //         this.applyOpeningHoursPluginNow($table);
    //         observer.disconnect();
    //     }
    // });
    // observer.observe(this.widgetContainer, { childList: true, subtree: true });
    // console.log('MutationObserver attached to:', this.widgetContainer);
  }

  createWidgetContent() {
    this.widgetContainer.innerHTML = `
            <div class="section-item section-item--transparent">
                <table class="ucd-library-homepage-hours js-responsive-table">
                    <tr>
                        <td>
                            <i class="fa fa-spinner fa-spin fa-fw"></i> Loading...
                        </td>
                    </tr>
                </table>
                <a href="https://www.ucd.ie/library/use/opening-hours/" class="button button--large button--opening-hours-table-row">Hours for Cultural Heritage Collections</a>
                <a href="https://www.ucd.ie/library/use/opening-hours/" class="button button--large">See full schedule &amp; service hours</a>
            </div>
        `;
  }

  applyOpeningHoursPluginNow($table) {
    try {
      $table.renderOpeningHoursForToday({
        debug: !0,
        debugDate: new Date(),
        xmlUrl: getOpeningHoursXMLURL(),
        onRenderSuccess: function () {
          $table.responsiveTable(); // Apply responsiveTable to the specific table
        },
      });
    } catch (e) {
      console.error("Error rendering today's hours:", e);
      $table.html("<tr><td>Error loading opening hours.</td></tr>");
    }
  }

  injectStyles(container) {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles.replace(/^\s+|\n/gm, "");
    document.head.appendChild(styleTag);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const targetElement = document.querySelector(".widget__container");
  if (targetElement) {
    new HoursWidget(targetElement);
  } else {
    console.error(
      "No element with class 'widget__container' found in the DOM."
    );
  }
});

function getOpeningHoursXMLURL() {
  const e = "/library/template-assets/openinghours/opening-hours.xml";
  return window.location.hostname.includes("ucd.ie") ? e : "/opening-hours.xml";
}
