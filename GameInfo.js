(function () {
  let datastream;
  return {
    init: function (comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find("Thumbnail")[0];
      const SCOREBUG = comp.parent().find("Score Bug")[0];
      const ALERTS = comp.parent().find("Alerts")[0];

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
          isRunning: true,
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
      // 012345678901234567890123456789012345678901234567890123456789
      // 77:10    6 5   4 33 54 0:4636 0:5985 1:1984 1:32CA
      // 77:03  s 6 5   4 33 54 0:3936 0:5285 1:1384 1:2516
      const PARSING_INDEXES_5000 = {
        basketball: {
          game_timer: {
            minutes: [0, 2],
            seconds: [3, 5],
            milliseconds: [0, 0],
            isRunning: [7, 8],
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
            isRunning: [7, 8],
          },
          score_home: [8, 10],
          score_away: [10, 12],
          fouls_home: [14, 16],
          fouls_away: [16, 18],
          game_period: [18, 19],
          penalties: {
            home: {
              penalty_1: {
                player: [20, 22],
                timer: {
                  minutes: [22, 24],
                  seconds: [25, 27],
                },
              },
              penalty_2: {
                player: [27, 29],
                timer: {
                  minutes: [29, 31],
                  seconds: [32, 34],
                },
              },
            },
            away: {
              penalty_1: {
                player: [34, 36],
                timer: {
                  minutes: [36, 38],
                  seconds: [39, 41],
                },
              },
              penalty_2: {
                player: [41, 43],
                timer: {
                  minutes: [43, 45],
                  seconds: [46, 48],
                },
              },
            },
          },
        },
      };

      let score_data = structuredClone(BASE_SCORE_DATA);
      datastream = context.utils.createDataStream(
        "2RyUH29htuuAGDajfq2fkD",
        (status, payload) => {
          switch (status) {
            case "message":
              console.log("Received score data: ", payload.payload.line);
              parse_line(payload.payload.line, score_data);
              updateUI(score_data);
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

      function parse_line(line, target) {
        function timeDigits(line) {
          return line.substring(0, line.indexOf(":")).length >= 2
            ? false
            : true;
        }

        let selected_sport = "hockey"; //get from control node

        function handleTimer() {

          const isRunning = score_data.game_timer.isRunning;
          let lastTimerState =
            CONTROLNODES.score_bug["game_timer"]["isRunning"];

          if (lastTimerState !== isRunning) {
            if (isRunning) {
              SCOREBUG.findWidget("game_timer").forEach((e) => {
                e.setPayload({
                  timeControl: CONTROLNODES.score_bug["game_timer"],
                  beginMinutes: score_data.game_timer.minutes,
                  beginSeconds: score_data.game_timer.seconds,
                });
                CONTROLNODES.score_bug["game_timer"]["isRunning"] = true;
              });
            } else {
              SCOREBUG.findWidget("game_timer").forEach((e) => {
                CONTROLNODES.score_bug["game_timer"]["isRunning"] = false;
                e.setPayload({
                  timeControl: CONTROLNODES.score_bug["game_timer"],
                  beginMinutes: score_data.game_timer.minutes,
                  beginSeconds: score_data.game_timer.seconds,
                });
              });
            }
          }
        }

        function checkSpecial(key, raw) {
          switch (key) {
            case "isRunning":
              return raw !== "s";
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

            if (Array.isArray(value)) {
              const [start, end] = value;

              if (start === 0 && end === 0) continue;

              const raw = line.slice(start, end);

              if (!raw) continue;

              targetObj[key] = checkSpecial(key, raw.trim());
            } else if (typeof value === "object") {
              if (!targetObj[key]) targetObj[key] = {};
              applyIndexes(value, targetObj[key]);
            }
          }
        }

        if (line.substring(0, line.indexOf(":")).length < 2) {
          line = " " + line;
        }

        console.log("Handling line: ", line);
        applyIndexes(PARSING_INDEXES_5000[selected_sport], target);
        handleTimer();

        return target;
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

          const score_bug_style = SCOREBUG.getModel()
            .find((i) => i.id === "score_bug_style")
            ["selections"].find(
              (s) => s.id === CONTROLNODES.score_bug["score_bug_style"],
            );

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
                break;
              default:
                POWERPLAY.setPositionX(
                  score_bug_style["events"][power_play]["position"]["x"],
                );
                POWERPLAY.setPositionY(
                  score_bug_style["events"][power_play]["position"]["y"],
                );
                POWERPLAY.setVisibility("true");
                break;
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
          function setText(text) {
            ALERTS.findWidget("text").forEach((w) => {
              w.setPayload({
                text: text,
              });
            });
          }

          const alerts = [
            "match_up",
            "timeout_home",
            "timeout_away",
            "goal",
            "bottom_text",
          ];

          const alert_selection = ALERTS.getModel()
            .find((i) => i.id === "alert_selection")
            ["selections"].find(
              (s) => s.id === CONTROLNODES.alerts["alert_selection"],
            );

          const title_home_override =
            CONTROLNODES.alerts["title_home_override"];

          const title_away_override =
            CONTROLNODES.alerts["title_away_override"];

          if (title_home_override != "") {
            home_team["title"] = title_home_override;
          } else {
            home_team["title"] = CONTROLNODES.game_info["home_team"];
          }

          if (title_away_override != "") {
            away_team["title"] = title_away_override;
          } else {
            away_team["title"] = CONTROLNODES.game_info["away_team"];
          }

          if (CONTROLNODES.alerts["show_scores"]) {
            let score_text = `${home_team["title"]}: ${score_data["score_home"]}  vs   ${away_team["title"]}: ${score_data["score_away"]}`;
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

          alerts.forEach((a) => {
            let group = ALERTS.findGroup(a)[0];
            if (group) {
              group.setVisibility(false);
              if (a === alert_selection.id) {
                group.setVisibility(true);
                switch (a) {
                  case "timeout_home":
                    setText(`TIMEOUT ${home_team["title"]}`);
                    break;
                  case "timeout_away":
                    setText(`TIMEOUT ${away_team["title"]}`);
                    break;
                  case "goal":
                    setText("GOAL");
                    break;
                  default:
                    setText(CONTROLNODES.alerts["bottom_text"]);
                    break;
                }
              }
            }
          });
        }

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

        const home_team = GAMEINFO.getModel()
          .find((i) => i.id === "home_team")
          ["selections"].find(
            (t) => t.id === CONTROLNODES.game_info["home_team"],
          );

        const away_team = GAMEINFO.getModel()
          .find((i) => i.id === "away_team")
          ["selections"].find(
            (t) => t.id === CONTROLNODES.game_info["away_team"],
          );

        updateThumbnail();
        updateScoreBug();
        updateAlerts();
        updateWidgets();
      }

      SUBCOMPS.forEach((sub_comp) => {
        sub_comp.addListener("payload_changed", (event, msg, e) => {
          updateUI(msg.payload);
          e.stopPropagation();
        });
      });

      updateUI(score_data);
    },
    close: function (comp, context) {
      console.log("Close Composition script " + comp.name);
      if (datastream) {
        datastream.close();
      }
    },
  };
})();
