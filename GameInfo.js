(function () {
  let datastream;
  return {
    init: function (comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find("Thumbnail")[0];
      const SCOREBUG = comp.parent().find("Score Bug")[0];
      const ALERTS = comp.parent().find("Alert")[0];

      const SUBCOMPS = [GAMEINFO, THUMBNAIL, SCOREBUG, ALERTS];
      const CONTROLNODES = {
        game_info: GAMEINFO.getControlNode().payload,
        thumbnail: THUMBNAIL.getControlNode().payload,
        alerts: ALERTS.getControlNode().payload,
        score_bug: SCOREBUG.getControlNode().payload,
      };

      const BASE_SCORE_DATA = {
        game_timer: {
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          timer_stopped: true,
        },
        score_home: 0,
        score_away: 0,
        fouls_home: 0,
        fouls_away: 0,
        game_period: 0,
        penalties: {
          home: {
            penalty_1: { player: 0, timer: { minutes: 0, seconds: 0 } },
            penalty_2: { player: 0, timer: { minutes: 0, seconds: 0 } },
          },
          away: {
            penalty_1: { player: 0, timer: { minutes: 0, seconds: 0 } },
            penalty_2: { player: 0, timer: { minutes: 0, seconds: 0 } },
          },
        },
      };

      const PARSING_INDEXES_5000 = {
        basketball: {
          game_timer: {
            minutes: [0, 2],
            seconds: [3, 5],
            milliseconds: [0, 0],
            timer_stopped: [7, 8],
          },
          score_home: [13, 15],
          score_away: [16, 18],
          fouls_home: [18, 20],
          fouls_away: [20, 22],
          game_period: [28, 29],
        },
        hockey: {
          game_timer: {
            minutes: [0, 2],
            seconds: [3, 5],
            milliseconds: [6, 7],
            timer_stopped: [7, 8],
          },
          score_home: [8, 10],
          score_away: [10, 12],
          fouls_home: [14, 16],
          fouls_away: [16, 18],
          game_period: [18, 19],
          penalties: {
            home: {
              penalty_1: {
                player: [0, 0],
                timer: {
                  minutes: [22, 24],
                  seconds: [25, 27],
                },
              },
              penalty_2: {
                player: [0, 0],
                timer: {
                  minutes: [0, 0],
                  seconds: [0, 0],
                },
              },
            },
            away: {
              penalty_1: {
                player: [0, 0],
                timer: {
                  minutes: [36, 38],
                  seconds: [39, 41],
                },
              },
              penalty_2: {
                player: [0, 0],
                timer: {
                  minutes: [0, 0],
                  seconds: [0, 0],
                },
              },
            },
          },
        },
      };

      let score_data = {
        game_timer: {
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          timer_stopped: true,
        },
        score_home: 0,
        score_away: 0,
        fouls_home: 0,
        fouls_away: 0,
        game_period: 0,
        penalties: {
          home: {
            penalty_1: {
              player: 0,
              timer: {
                minutes: 0,
                seconds: 0,
              },
            },
            penalty_2: {
              player: 0,
              timer: {
                minutes: 0,
                seconds: 0,
              },
            },
          },
          away: {
            penalty_1: {
              player: 0,
              timer: {
                minutes: 0,
                seconds: 0,
              },
            },
            penalty_2: {
              player: 0,
              timer: {
                minutes: 0,
                seconds: 0,
              },
            },
          },
        },
      };

      datastream = context.utils.createDataStream(
        "2RyUH29htuuAGDajfq2fkD",
        (status, payload) => {
          switch (status) {
            case "message":
              console.log("Received score data: ", status, payload);
              score_data = parse_line(payload.payload);
              updateUI();
              break;
            case "connecting":
            case "connect":
            case "open":
            case "close":
            case "disconnect":
              console.log("status:", status);
              break;
            case "error":
              console.error("error:", status);
              break;
          }
        },
      );

      function parse_line(line) {
        if (line.length < 26) {
          // console.log(`Line length: ${line.length}. Expected at least ${Math.max(...Object.values(indexes).map(([_, end]) => end))} characters.`);
          return score_data;
        }

        //   line = line.replace(/^b'|'$/g, '');
        //   line = line.replace(/[\x00-\x1F\x7F]/g, '');
        //   line = line.replace(/\n$/, '');

        const indexes = PARSING_INDEXES_5000[selected_sport];
        const parsed_data = structuredClone(BASE_SCORE_DATA);

        function checkSpecial(key, raw) {
          switch (key) {
            case "timer_stopped":
              return raw === "s";
            case "game_period":
              switch (raw) {
                case "1":
                  return "1st";
                case "2":
                  return "2nd";
                case "3":
                  return "3rd";
                case "4":
                  return "4th";
                case "5":
                  return "OT";
                default:
                  break;
              }
            default:
              return isNaN(raw) ? raw : Number(raw);
          }
        }

        function applyIndexes(indexObj, targetObj) {
          for (const key in indexObj) {
            const value = indexObj[key];

            // If value is an index pair
            if (Array.isArray(value)) {
              const [start, end] = value;

              // Ignore [0,0]
              if (start === 0 && end === 0) continue;

              const raw = line.slice(start, end).trim();

              targetObj[key] = checkSpecial(key, raw);
            }

            // If nested object
            else if (typeof value === "object" && value !== null) {
              if (!targetObj[key]) targetObj[key] = {};
              applyIndexes(value, targetObj[key]);
            }
          }
        }

        applyIndexes(indexes, parsed_data);

        return parsed_data;
      }

      function updateUI(payload) {
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

        function updateScoreBug() {
          const POWERPLAY = SCOREBUG.find("PowerPlay")[0];
          const EMPTYNET = SCOREBUG.find("EmptyNet")[0];

          function manualUpdateScoreData() {
            const power_play_selection = SCOREBUG.getModel()
              .find((i) => i.id === "power_play")
              ["selections"].find(
                (s) => s.id === CONTROLNODES.score_bug["power_play"],
              ).id;

            const empty_net_selection = SCOREBUG.getModel()
              .find((i) => i.id === "empty_net")
              ["selections"].find(
                (s) => s.id === CONTROLNODES.score_bug["empty_net"],
              ).id;

            score_data["game_timer"]["minutes"] = parseInt(
              CONTROLNODES.score_bug["reset_minutes"],
            );
            score_data["game_timer"]["seconds"] = parseInt(
              CONTROLNODES.score_bug["reset_seconds"],
            );

            // TODO MANUAL SCORING IS 1 DIGIT OFF
            score_data["score_home"] = CONTROLNODES.score_bug["score_home"];
            score_data["score_away"] = CONTROLNODES.score_bug["score_away"];

            switch (CONTROLNODES.score_bug["game_period"]) {
              case 1:
                score_data["game_period"] = "1st";
                break;
              case 2:
                score_data["game_period"] = "2nd";
                break;
              case 3:
                score_data["game_period"] = "3rd";
                break;
              case 4:
                score_data["game_period"] = "4th";
                break;
              case 5:
                score_data["game_period"] = "OT";
                break;
              default:
                break;
            }

            if (power_play_selection !== "power_play_none") {
              POWERPLAY.setPositionX(
                score_bug_style["events"][power_play_selection]["position"][
                  "x"
                ],
              );
              POWERPLAY.setPositionY(
                score_bug_style["events"][power_play_selection]["position"][
                  "y"
                ],
              );
              POWERPLAY.setVisibility("true");
            } else {
              POWERPLAY.setVisibility("false");
            }

            if (empty_net_selection !== "empty_net_none") {
              EMPTYNET.setPositionX(
                score_bug_style["events"][empty_net_selection]["position"]["x"],
              );
              EMPTYNET.setPositionY(
                score_bug_style["events"][empty_net_selection]["position"]["y"],
              );
              EMPTYNET.setVisibility("true");
            } else {
              EMPTYNET.setVisibility("false");
            }
          }

          function checkPenalties(penalties) {
            for (const [key, value] of Object.entries(penalties)) {
              if (typeof value === "object" && value !== null) {
                checkPenalties(value);
              }
            }
          }

          function checkPowerPlay() {
            if (
              score_data["penalties"]["home"]["penalty_1"]["timer"]["seconds"] >
                0 &&
              score_data["penalties"]["away"]["penalty_1"]["timer"][
                "seconds"
              ] <= 0
            ) {
              return "power_play_away";
            } else if (
              score_data["penalties"]["home"]["penalty_1"]["timer"][
                "seconds"
              ] <= 0 &&
              score_data["penalties"]["away"]["penalty_1"]["timer"]["seconds"] >
                0
            ) {
              return "power_play_home";
            } else {
              return "power_play_none";
            }
          }

          function scoreBugStyle() {
            const score_bug_styles = SCOREBUG.getModel().find(
              (i) => i.id === "score_bug_style",
            )["selections"];

            score_bug_styles.forEach((s) => {
              SCOREBUG.findGroup(s["style"])[0].setVisibility("false");
            });

            SCOREBUG.findGroup(score_bug_style["style"])[0].setVisibility(
              "true",
            );
            SCOREBUG.setPositionX(score_bug_style["position"]["x"]);
            SCOREBUG.setPositionY(score_bug_style["position"]["y"]);
          }
          scoreBugStyle();

          if (CONTROLNODES.score_bug["manual_scoring"]) {
            manualUpdateScoreData();
          } else {
            let penalties = checkPenalties(score_data["penalties"]);
            let power_play = checkPowerPlay();

            switch (power_play) {
              case "power_play_none":
                POWERPLAY.setVisibility("false");
              default:
                POWERPLAY.setPositionX(
                  score_bug_style["events"][power_play]["position"]["x"],
                );
                POWERPLAY.setPositionY(
                  score_bug_style["events"][power_play]["position"]["y"],
                );
                POWERPLAY.setVisibility("true");
            }
          }

          SCOREBUG.findWidget("game_period").forEach((e) => {
            e.setPayload({
              text: score_data["game_period"],
            });
          });
          SCOREBUG.findWidget("game_timer").forEach((e) => {
            e.setPayload({
              timeControl: CONTROLNODES.score_bug["game_timer"],
              beginMinutes: score_data["game_timer"]["minutes"],
              beginSeconds: score_data["game_timer"]["seconds"],
            });
          });
        }

        function updateAlerts() {
          if (CONTROLNODES.alerts["show_scores"]) {
            if (/\s/g.test(away_team["title"])) {
              away_team["title"] =
                away_team["title"].substring(0, 1) +
                "." +
                away_team["title"].substring(
                  away_team["title"].indexOf(" "),
                  away_team["title"].length,
                );
            }
            let score_text = `Arlington: ${score_data["score_home"]}  vs   ${away_team["title"]}: ${score_data["score_away"]}`;
            ALERTS.findWidget("show_scores").forEach((w) => {
              w.setPayload({
                text: score_text,
              });
            });
            ALERTS.findWidget("title_home").forEach((w) => {
              w.setVisibility("false");
            });
            ALERTS.findWidget("title_away").forEach((w) => {
              w.setVisibility("false");
            });
          } else {
            ALERTS.findWidget("show_scores").forEach((w) => {
              w.setPayload({
                text: "vs",
              });
            });
            ALERTS.findWidget("title_home").forEach((w) => {
              w.setVisibility("true");
            });
            ALERTS.findWidget("title_away").forEach((w) => {
              w.setVisibility("true");
            });
          }
          ALERTS.findWidget("text").forEach((w) => {
            w.setPayload({
              text: CONTROLNODES.alerts["bottom_text"],
            });
          });
        }

        const away_team = GAMEINFO.getModel()
          .find((i) => i.id === "Opponent")
          ["selections"].find(
            (t) => t.id === CONTROLNODES.game_info["Opponent"],
          );

        const score_bug_style = SCOREBUG.getModel()
          .find((i) => i.id === "score_bug_style")
          ["selections"].find(
            (s) => s.id === CONTROLNODES.score_bug["score_bug_style"],
          );

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
          title_away: { text: away_team["title"] },
          abbr_away: { text: away_team["abbreviation"] },
          score_away: { text: score_data["score_away"] },
          score_home: { text: score_data["score_home"] },
          icon_away: { image: away_team["icon"] },
        };

        let selected_sport = "hockey"; //get from control node
        console.log(payload);

        updateThumbnail();
        updateScoreBug();
        updateAlerts();

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

      SUBCOMPS.forEach((sub_comp) => {
        sub_comp.addListener("payload_changed", (event, msg, e) => {
          updateUI(msg.payload);
          e.stopPropagation();
        });
      });

      updateUI();
    },
    close: function (comp, context) {
      console.log("Close Composition script " + comp.name);
      if (datastream) {
        datastream.close();
      }
    },
  };
})();
