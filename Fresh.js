(function () {
  return {
    init: function (comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.find("GameInfo")[0];
      const THUMBNAIL = comp.find("Thumbnail")[0];
      const SCOREBUGS = [];
      comp.children().forEach((subcomp) => {
        if (subcomp.name.includes("Score Bug")) {
          SCOREBUGS.push(subcomp);
        }
      });

      function updateWidgets() {
        const widget_payloads = {
          color_primary: {
            fillGradient: {
              solidColor: CONTROLNODES.game_info["color_primary"],
            },
          },
          color_secondary: {
            fillGradient: {
              solidColor: CONTROLNODES.game_info["color_secondary"],
            },
          },
          title_home: { text: home_team["title"] },
          title_away: { text: away_team["title"] },
          abbr_home: { text: home_team["abbreviation"] },
          abbr_away: { text: away_team["abbreviation"] },
          score_away: { text: score_data["score_away"] },
          score_home: { text: score_data["score_home"] },
          icon_home: { image: home_team["icon"] },
          icon_away: { image: away_team["icon"] },
        };

        SUBCOMPS.forEach((sub_comp) => {
          function checkContainsWidget(widget) {
            try {
              let contains = sub_comp.findWidget(widget);
              // console.log(sub_comp.findWidget(widget));
              return true;
            } catch {
              // console.log(`No ${widget} widgets in ${sub_comp.name}`);
              return false;
            }
          }

          Object.entries(widget_payloads).forEach(([widget, payload]) => {
            if (checkContainsWidget(widget)) {
              sub_comp.findWidget(widget).forEach((w) => {
                w.setPayload(payload);
              });
            }
          });
        });
      }

      function updateThumbnail() {
        THUMBNAIL.findWidget("date")[0].setPayload({
          text: CONTROLNODES.game_info["date"],
        });

        THUMBNAIL.findWidget("BOG")[0].setPayload({
          text: CONTROLNODES.game_info["BOG"],
        });

        THUMBNAIL.findWidget("Sport")[0].setPayload({
          image: CONTROLNODES.game_info["Sport"],
        });

        THUMBNAIL.findWidget("Background")[0].setPayload({
          image: CONTROLNODES.game_info["Location"],
        });
      }

      function updateUI() {
        updateWidgets();
        updateThumbnail();
      }

      comp.addListener("payload_changed", (event, msg, e) => {
        if (msg.compositionId === comp.id) {
          const payload = comp.getPayload2();
        }
        e.stopPropagation();
      });
    },

    close: function (comp, context) {
      console.log("Close Composition script " + comp.name);
    },
  };
})();
