(function () {
  let datastream;
  return {
    init: function (comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find("Thumbnail")[0];
      const SCOREBUG = comp.parent().find("Score Bug")[0];
      const LOGO = comp.parent().find("Logo")[0];
      const LOWERMATCHUP = comp.parent().find("Lower Match Up")[0];
      const TIMEOUT = comp.parent().find("Timeout")[0];
      const POWERPLAY = SCOREBUG.find("PowerPlay")[0];
      const EMPTYNET = SCOREBUG.find("EmptyNet")[0];

      let game_info_control_node = GAMEINFO.getControlNode().payload;
      let score_bug_control_node = SCOREBUG.getControlNode().payload;
      let lower_matchup_control_node = LOWERMATCHUP.getControlNode().payload;
      let logo_control_node = LOGO.getControlNode().payload;

      const away_teams = GAMEINFO.getModel().find((i) => i.id === "Opponent")[
        "selections"
      ];
      let away_team = away_teams.find(
        (t) => t.id === game_info_control_node["Opponent"],
      );
      let selected_sport = "hockey";

      const score_bug_styles = SCOREBUG.getModel().find(
        (i) => i.id === "score_bug_style",
      )["selections"];
      let score_bug_style = score_bug_styles.find(
        (s) => s.id === score_bug_control_node["score_bug_style"],
      );
      const power_play_selections = SCOREBUG.getModel().find(
        (i) => i.id === "power_play",
      )["selections"];
      let power_play = power_play_selections.find(
        (s) => s.id === score_bug_control_node["power_play"],
      ).id;
      const empty_net_selections = SCOREBUG.getModel().find(
        (i) => i.id === "empty_net",
      )["selections"];
      let empty_net = empty_net_selections.find(
        (s) => s.id === score_bug_control_node["empty_net"],
      ).id;

      const BASE_SCORE_DATA = {
        game_timer: {
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          timer_stopped: true,
        },
        home_score: 0,
        away_score: 0,
        home_fouls: 0,
        away_fouls: 0,
        period: 0,
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
          home_score: [13, 15],
          away_score: [16, 18],
          home_fouls: [18, 20],
          away_fouls: [20, 22],
          period: [28, 29],
        },
        hockey: {
          game_timer: {
            minutes: [0, 2],
            seconds: [3, 5],
            milliseconds: [6, 7],
            timer_stopped: [7, 8],
          },
          home_score: [8, 10],
          away_score: [10, 12],
          home_fouls: [14, 16],
          away_fouls: [16, 18],
          period: [18, 19],
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
        home_score: 0,
        away_score: 0,
        home_fouls: 0,
        away_fouls: 0,
        period: 0,
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
            case "period":
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

      function checkPenalties(penalties) {
        for (const [key, value] of Object.entries(penalties)) {
          if (typeof value === "object" && value !== null) {
            checkPenalties(value);
          }
        }
      }

      function updateThumbnail() {
        THUMBNAIL.findWidget("Date")[0].setPayload({
          text: game_info_control_node["Date"],
        });

        THUMBNAIL.findWidget("AwayName")[0].setPayload({
          text: away_team["title"],
        });

        THUMBNAIL.findWidget("AwayIcon")[0].setPayload({
          image: away_team["icon"],
        });

        THUMBNAIL.findWidget("BOG")[0].setPayload({
          text: game_info_control_node["BOG"],
        });

        THUMBNAIL.findWidget("Sport")[0].setPayload({
          image: game_info_control_node["Sport"],
        });

        THUMBNAIL.findWidget("Background")[0].setPayload({
          image: game_info_control_node["Location"],
        });
      }

      function manualUpdateScoreData() {
        score_data["game_timer"]["minutes"] = parseInt(
          score_bug_control_node["reset_minutes"],
        );
        score_data["game_timer"]["seconds"] = parseInt(
          score_bug_control_node["reset_seconds"],
        );
        score_data["home_score"] = parseInt(
          score_bug_control_node["home_score"],
        );
        score_data["away_score"] = parseInt(
          score_bug_control_node["away_score"],
        );

        switch (score_bug_control_node["period"]) {
          case 1:
            score_data["period"] = "1st";
            break;
          case 2:
            score_data["period"] = "2nd";
            break;
          case 3:
            score_data["period"] = "3rd";
            break;
          case 4:
            score_data["period"] = "4th";
            break;
          case 5:
            score_data["period"] = "OT";
            break;
          default:
            break;
        }

        if (power_play !== "power_play_none") {
          POWERPLAY.setPositionX(
            score_bug_style["events"][power_play]["position"]["x"],
          );
          POWERPLAY.setPositionY(
            score_bug_style["events"][power_play]["position"]["y"],
          );
          POWERPLAY.setVisibility("true");
        } else {
          POWERPLAY.setVisibility("false");
        }

        if (empty_net !== "empty_net_none") {
          EMPTYNET.setPositionX(
            score_bug_style["events"][empty_net]["position"]["x"],
          );
          EMPTYNET.setPositionY(
            score_bug_style["events"][empty_net]["position"]["y"],
          );
          EMPTYNET.setVisibility("true");
        } else {
          EMPTYNET.setVisibility("false");
        }
      }

      function updateScoreBug() {
        score_bug_style = score_bug_styles.find(
          (s) => s.id === score_bug_control_node["score_bug_style"],
        );
        score_bug_styles.forEach((s) => {
          SCOREBUG.findGroup(s["style"])[0].setVisibility("false");
        });
        SCOREBUG.findGroup(score_bug_style["style"])[0].setVisibility("true");
        SCOREBUG.setPositionX(score_bug_style["position"]["x"]);
        SCOREBUG.setPositionY(score_bug_style["position"]["y"]);

        if (score_bug_control_node["manual_scoring"]) {
          manualUpdateScoreData();
        } else {
          let penalties = checkPenalties(score_data["penalties"]);

          if (
            score_data["penalties"]["home"]["penalty_1"]["timer"]["seconds"] >
              0 &&
            score_data["penalties"]["away"]["penalty_1"]["timer"]["seconds"] <=
              0
          ) {
            power_play = "power_play_away";
            POWERPLAY.setVisibility("true");
            POWERPLAY.setPositionX(
              score_bug_style["events"][power_play]["position"]["x"],
            );
            POWERPLAY.setPositionY(
              score_bug_style["events"][power_play]["position"]["y"],
            );
          } else if (
            score_data["penalties"]["home"]["penalty_1"]["timer"]["seconds"] <=
              0 &&
            score_data["penalties"]["away"]["penalty_1"]["timer"]["seconds"] > 0
          ) {
            power_play = "power_play_home";
            POWERPLAY.setVisibility("true");
            POWERPLAY.setPositionX(
              score_bug_style["events"][power_play]["position"]["x"],
            );
            POWERPLAY.setPositionY(
              score_bug_style["events"][power_play]["position"]["y"],
            );
          } else {
            POWERPLAY.setVisibility("false");
          }
        }

        SCOREBUG.findWidget("Primary").forEach((e) => {
          e.setPayload({
            fillGradient: {
              solidColor: game_info_control_node["Primary"],
            },
          });
        });
        SCOREBUG.findWidget("Secondary").forEach((e) => {
          e.setPayload({
            fillGradient: {
              solidColor: game_info_control_node["Secondary"],
            },
          });
        });
        SCOREBUG.findWidget("AwayName").forEach((e) => {
          e.setPayload({
            text: away_team["title"],
          });
        });
        SCOREBUG.findWidget("AwayAbbr").forEach((e) => {
          e.setPayload({
            text: away_team["abbreviation"],
          });
        });
        SCOREBUG.findWidget("AwayScore").forEach((e) => {
          e.setPayload({
            text: score_data["away_score"],
          });
        });
        SCOREBUG.findWidget("HomeScore").forEach((e) => {
          e.setPayload({
            text: score_data["home_score"],
          });
        });
        SCOREBUG.findWidget("Period").forEach((e) => {
          e.setPayload({
            text: score_data["period"],
          });
        });
        SCOREBUG.findWidget("GameTimer").forEach((e) => {
          e.setPayload({
            timeControl: score_bug_control_node["game_timer"],
            beginMinutes: score_data["game_timer"]["minutes"],
            beginSeconds: score_data["game_timer"]["seconds"],
          });
        });
      }

      function updateLowerMatchUp() {
        if (lower_matchup_control_node["show_scores"]) {
          // if (/\s/g.test(away_team['title'])) {
          //   away_team['title'] = away_team['title'].substring(0, 1) + "." + away_team['title'].substring(away_team['title'].indexOf(' '), away_team['title'].length)
          // }
          let score_text = `Arlington: ${score_data["home_score"]}  vs   ${away_team["title"]}: ${score_data["away_score"]}`;
          LOWERMATCHUP.findWidget("Score")[0].setPayload({
            text: score_text,
          });
          LOWERMATCHUP.findWidget("HomeName")[0].setVisibility("false");
          LOWERMATCHUP.findWidget("AwayName")[0].setVisibility("false");
        } else {
          LOWERMATCHUP.findWidget("Score")[0].setPayload({
            text: "vs",
          });
          LOWERMATCHUP.findWidget("HomeName")[0].setVisibility("true");
          LOWERMATCHUP.findWidget("AwayName")[0].setVisibility("true");
        }

        LOWERMATCHUP.findWidget("Primary").forEach((e) => {
          e.setPayload({
            fillGradient: {
              solidColor: game_info_control_node["Primary"],
            },
          });
        });
        LOWERMATCHUP.findWidget("Secondary").forEach((e) => {
          e.setPayload({
            fillGradient: {
              solidColor: game_info_control_node["Secondary"],
            },
          });
        });
        LOWERMATCHUP.findWidget("AwayIcon")[0].setPayload({
          image: away_team["icon"],
        });
        LOWERMATCHUP.findWidget("AwayName")[0].setPayload({
          text: away_team["title"],
        });
        LOWERMATCHUP.findWidget("Subtext")[0].setPayload({
          text: lower_matchup_control_node["lower_text"],
        });
      }

      function updateUI() {
        updateThumbnail();
        updateScoreBug();
        updateLowerMatchUp();
      }

      GAMEINFO.addListener("payload_changed", (event, msg, e) => {
        for (const key in msg.payload) {
          if (game_info_control_node[key] !== msg.payload[key]) {
            game_info_control_node[key] = msg.payload[key];
          }
        }
        away_team = away_teams.find(
          (t) => t.id === game_info_control_node["Opponent"],
        );
        updateUI();
        e.stopPropagation();
      });

      SCOREBUG.addListener("payload_changed", (event, msg, e) => {
        for (const key in msg.payload) {
          if (score_bug_control_node[key] !== msg.payload[key]) {
            score_bug_control_node[key] = msg.payload[key];
          }
        }
        score_bug_style = score_bug_styles.find(
          (s) => s.id === score_bug_control_node["score_bug_style"],
        );
        power_play = power_play_selections.find(
          (s) => s.id === score_bug_control_node["power_play"],
        ).id;
        empty_net = empty_net_selections.find(
          (s) => s.id === score_bug_control_node["empty_net"],
        ).id;
        updateUI();
        e.stopPropagation();
      });

      LOWERMATCHUP.addListener("payload_changed", (event, msg, e) => {
        for (const key in msg.payload) {
          if (lower_matchup_control_node[key] !== msg.payload[key]) {
            lower_matchup_control_node[key] = msg.payload[key];
          }
        }
        updateUI();
        e.stopPropagation();
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
