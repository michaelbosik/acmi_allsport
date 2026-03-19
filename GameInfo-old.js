(function () {
  let datastream;
  return {
    init: function (comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find("Thumbnail")[0];
      const SCOREBUG = comp.parent().find("Score Bug")[0];
      const ALERT = comp.parent().find("Alert")[0];
      // const LOGO = comp.parent().find("Logo")[0];
      // const LOWERMATCHUP = ALERT.findGroup("match_up")[0];
      // const TIMEOUT_HOME = ALERT.findGroup("timeout_home")[0];
      // const TIMEOUT_AWAY = ALERT.findGroup("timeout_away")[0];
      // const GOAL = ALERT.findGroup("goal")[0];
      // const BOTTOM_TEXT = ALERT.findGroup("bottom_text")[0];
      // const POWERPLAY = SCOREBUG.find("PowerPlay")[0];
      // const EMPTYNET = SCOREBUG.find("EmptyNet")[0];
      const SUBCOMPS = [THUMBNAIL, SCOREBUG, ALERT];
      let CONTROLNODES = {
        game_info: GAMEINFO.getControlNode().payload,
        thumbnail: THUMBNAIL.getControlNode().payload,
        alerts: ALERT.getControlNode().payload,
        score_bug: SCOREBUG.getControlNode().payload,
      };

      // let game_info_control_node = GAMEINFO.getControlNode().payload;
      // let score_bug_control_node = SCOREBUG.getControlNode().payload;
      // let alert_control_node = ALERT.getControlNode().payload;
      // let logo_control_node = LOGO.getControlNode().payload;

      // const away_teams = GAMEINFO.getModel().find((i) => i.id === "Opponent")[
      //   "selections"
      // ];
      // let away_team = away_teams.find(
      //   (t) => t.id === game_info_control_node["Opponent"],
      // );
      let selected_sport = "hockey";

      const score_bug_styles = SCOREBUG.getModel().find(
        (i) => i.id === "score_bug_style",
      )["selections"];
      let score_bug_style = score_bug_styles.find(
        (s) => s.id === score_bug_control_node["score_bug_style"],
      );
      // const power_play_selections = SCOREBUG.getModel().find(
      //   (i) => i.id === "power_play",
      // )["selections"];
      // let power_play = power_play_selections.find(
      //   (s) => s.id === score_bug_control_node["power_play"],
      // ).id;
      // const empty_net_selections = SCOREBUG.getModel().find(
      //   (i) => i.id === "empty_net",
      // )["selections"];
      // let empty_net = empty_net_selections.find(
      //   (s) => s.id === score_bug_control_node["empty_net"],
      // ).id;

      // const BASE_SCORE_DATA = {
      //   game_timer: {
      //     minutes: 0,
      //     seconds: 0,
      //     milliseconds: 0,
      //     timer_stopped: true,
      //   },
      //   home_score: 0,
      //   away_score: 0,
      //   home_fouls: 0,
      //   away_fouls: 0,
      //   game_period: 0,
      //   penalties: {
      //     home: {
      //       penalty_1: { player: 0, timer: { minutes: 0, seconds: 0 } },
      //       penalty_2: { player: 0, timer: { minutes: 0, seconds: 0 } },
      //     },
      //     away: {
      //       penalty_1: { player: 0, timer: { minutes: 0, seconds: 0 } },
      //       penalty_2: { player: 0, timer: { minutes: 0, seconds: 0 } },
      //     },
      //   },
      // };

      // const PARSING_INDEXES_5000 = {
      //   basketball: {
      //     game_timer: {
      //       minutes: [0, 2],
      //       seconds: [3, 5],
      //       milliseconds: [0, 0],
      //       timer_stopped: [7, 8],
      //     },
      //     home_score: [13, 15],
      //     away_score: [16, 18],
      //     home_fouls: [18, 20],
      //     away_fouls: [20, 22],
      //     game_period: [28, 29],
      //   },
      //   hockey: {
      //     game_timer: {
      //       minutes: [0, 2],
      //       seconds: [3, 5],
      //       milliseconds: [6, 7],
      //       timer_stopped: [7, 8],
      //     },
      //     home_score: [8, 10],
      //     away_score: [10, 12],
      //     home_fouls: [14, 16],
      //     away_fouls: [16, 18],
      //     game_period: [18, 19],
      //     penalties: {
      //       home: {
      //         penalty_1: {
      //           player: [0, 0],
      //           timer: {
      //             minutes: [22, 24],
      //             seconds: [25, 27],
      //           },
      //         },
      //         penalty_2: {
      //           player: [0, 0],
      //           timer: {
      //             minutes: [0, 0],
      //             seconds: [0, 0],
      //           },
      //         },
      //       },
      //       away: {
      //         penalty_1: {
      //           player: [0, 0],
      //           timer: {
      //             minutes: [36, 38],
      //             seconds: [39, 41],
      //           },
      //         },
      //         penalty_2: {
      //           player: [0, 0],
      //           timer: {
      //             minutes: [0, 0],
      //             seconds: [0, 0],
      //           },
      //         },
      //       },
      //     },
      //   },
      // };

      // let score_data = {
      //   game_timer: {
      //     minutes: 0,
      //     seconds: 0,
      //     milliseconds: 0,
      //     timer_stopped: true,
      //   },
      //   home_score: 0,
      //   away_score: 0,
      //   home_fouls: 0,
      //   away_fouls: 0,
      //   game_period: 0,
      //   penalties: {
      //     home: {
      //       penalty_1: {
      //         player: 0,
      //         timer: {
      //           minutes: 0,
      //           seconds: 0,
      //         },
      //       },
      //       penalty_2: {
      //         player: 0,
      //         timer: {
      //           minutes: 0,
      //           seconds: 0,
      //         },
      //       },
      //     },
      //     away: {
      //       penalty_1: {
      //         player: 0,
      //         timer: {
      //           minutes: 0,
      //           seconds: 0,
      //         },
      //       },
      //       penalty_2: {
      //         player: 0,
      //         timer: {
      //           minutes: 0,
      //           seconds: 0,
      //         },
      //       },
      //     },
      //   },
      // };

      // datastream = context.utils.createDataStream(
      //   "2RyUH29htuuAGDajfq2fkD",
      //   (status, payload) => {
      //     switch (status) {
      //       case "message":
      //         console.log("Received score data: ", status, payload);
      //         score_data = parse_line(payload.payload);
      //         updateUI();
      //         break;
      //       case "connecting":
      //       case "connect":
      //       case "open":
      //       case "close":
      //       case "disconnect":
      //         console.log("status:", status);
      //         break;
      //       case "error":
      //         console.error("error:", status);
      //         break;
      //     }
      //   },
      // );

      // function parse_line(line) {
      //   if (line.length < 26) {
      //     // console.log(`Line length: ${line.length}. Expected at least ${Math.max(...Object.values(indexes).map(([_, end]) => end))} characters.`);
      //     return score_data;
      //   }

      //   //   line = line.replace(/^b'|'$/g, '');
      //   //   line = line.replace(/[\x00-\x1F\x7F]/g, '');
      //   //   line = line.replace(/\n$/, '');

      //   const indexes = PARSING_INDEXES_5000[selected_sport];
      //   const parsed_data = structuredClone(BASE_SCORE_DATA);

      //   function checkSpecial(key, raw) {
      //     switch (key) {
      //       case "timer_stopped":
      //         return raw === "s";
      //       case "game_period":
      //         switch (raw) {
      //           case "1":
      //             return "1st";
      //           case "2":
      //             return "2nd";
      //           case "3":
      //             return "3rd";
      //           case "4":
      //             return "4th";
      //           case "5":
      //             return "OT";
      //           default:
      //             break;
      //         }
      //       default:
      //         return isNaN(raw) ? raw : Number(raw);
      //     }
      //   }

      //   function applyIndexes(indexObj, targetObj) {
      //     for (const key in indexObj) {
      //       const value = indexObj[key];

      //       // If value is an index pair
      //       if (Array.isArray(value)) {
      //         const [start, end] = value;

      //         // Ignore [0,0]
      //         if (start === 0 && end === 0) continue;

      //         const raw = line.slice(start, end).trim();

      //         targetObj[key] = checkSpecial(key, raw);
      //       }

      //       // If nested object
      //       else if (typeof value === "object" && value !== null) {
      //         if (!targetObj[key]) targetObj[key] = {};
      //         applyIndexes(value, targetObj[key]);
      //       }
      //     }
      //   }

      //   applyIndexes(indexes, parsed_data);

      //   return parsed_data;
      // }

      // function checkPenalties(penalties) {
      //   for (const [key, value] of Object.entries(penalties)) {
      //     if (typeof value === "object" && value !== null) {
      //       checkPenalties(value);
      //     }
      //   }
      // }

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

      // function updateScoreBug() {
      //   function manualUpdateScoreData() {
      //     score_data["game_timer"]["minutes"] = parseInt(
      //       score_bug_control_node["reset_minutes"],
      //     );
      //     score_data["game_timer"]["seconds"] = parseInt(
      //       score_bug_control_node["reset_seconds"],
      //     );
      //     score_data["home_score"] = parseInt(
      //       score_bug_control_node["home_score"],
      //     );
      //     score_data["away_score"] = parseInt(
      //       score_bug_control_node["away_score"],
      //     );

      //     switch (score_bug_control_node["game_period"]) {
      //       case 1:
      //         score_data["game_period"] = "1st";
      //         break;
      //       case 2:
      //         score_data["game_period"] = "2nd";
      //         break;
      //       case 3:
      //         score_data["game_period"] = "3rd";
      //         break;
      //       case 4:
      //         score_data["game_period"] = "4th";
      //         break;
      //       case 5:
      //         score_data["game_period"] = "OT";
      //         break;
      //       default:
      //         break;
      //     }

      //     if (power_play !== "power_play_none") {
      //       POWERPLAY.setPositionX(
      //         score_bug_style["events"][power_play]["position"]["x"],
      //       );
      //       POWERPLAY.setPositionY(
      //         score_bug_style["events"][power_play]["position"]["y"],
      //       );
      //       POWERPLAY.setVisibility("true");
      //     } else {
      //       POWERPLAY.setVisibility("false");
      //     }

      //     if (empty_net !== "empty_net_none") {
      //       EMPTYNET.setPositionX(
      //         score_bug_style["events"][empty_net]["position"]["x"],
      //       );
      //       EMPTYNET.setPositionY(
      //         score_bug_style["events"][empty_net]["position"]["y"],
      //       );
      //       EMPTYNET.setVisibility("true");
      //     } else {
      //       EMPTYNET.setVisibility("false");
      //     }
      //   }

      //   score_bug_style = score_bug_styles.find(
      //     (s) => s.id === score_bug_control_node["score_bug_style"],
      //   );
      //   score_bug_styles.forEach((s) => {
      //     SCOREBUG.findGroup(s["style"])[0].setVisibility("false");
      //   });
      //   SCOREBUG.findGroup(score_bug_style["style"])[0].setVisibility("true");
      //   SCOREBUG.setPositionX(score_bug_style["position"]["x"]);
      //   SCOREBUG.setPositionY(score_bug_style["position"]["y"]);

      //   if (score_bug_control_node["manual_scoring"]) {
      //     manualUpdateScoreData();
      //   } else {
      //     let penalties = checkPenalties(score_data["penalties"]);

      //     if (
      //       score_data["penalties"]["home"]["penalty_1"]["timer"]["seconds"] >
      //         0 &&
      //       score_data["penalties"]["away"]["penalty_1"]["timer"]["seconds"] <=
      //         0
      //     ) {
      //       power_play = "power_play_away";
      //       POWERPLAY.setVisibility("true");
      //       POWERPLAY.setPositionX(
      //         score_bug_style["events"][power_play]["position"]["x"],
      //       );
      //       POWERPLAY.setPositionY(
      //         score_bug_style["events"][power_play]["position"]["y"],
      //       );
      //     } else if (
      //       score_data["penalties"]["home"]["penalty_1"]["timer"]["seconds"] <=
      //         0 &&
      //       score_data["penalties"]["away"]["penalty_1"]["timer"]["seconds"] > 0
      //     ) {
      //       power_play = "power_play_home";
      //       POWERPLAY.setVisibility("true");
      //       POWERPLAY.setPositionX(
      //         score_bug_style["events"][power_play]["position"]["x"],
      //       );
      //       POWERPLAY.setPositionY(
      //         score_bug_style["events"][power_play]["position"]["y"],
      //       );
      //     } else {
      //       POWERPLAY.setVisibility("false");
      //     }
      //   }

      //   SCOREBUG.findWidget("game_period").forEach((e) => {
      //     e.setPayload({
      //       text: score_data["game_period"],
      //     });
      //   });
      //   SCOREBUG.findWidget("game_timer").forEach((e) => {
      //     e.setPayload({
      //       timeControl: score_bug_control_node["game_timer"],
      //       beginMinutes: score_data["game_timer"]["minutes"],
      //       beginSeconds: score_data["game_timer"]["seconds"],
      //     });
      //   });
      // }

      // function updateAlert() {
      //   if (alert_control_node["show_scores"]) {
      //     if (/\s/g.test(away_team["title"])) {
      //       away_team["title"] =
      //         away_team["title"].substring(0, 1) +
      //         "." +
      //         away_team["title"].substring(
      //           away_team["title"].indexOf(" "),
      //           away_team["title"].length,
      //         );
      //     }
      //     let score_text = `Arlington: ${score_data["home_score"]}  vs   ${away_team["title"]}: ${score_data["away_score"]}`;
      //     ALERT.findWidget("show_scores").forEach((w) => {
      //       w.setPayload({
      //         text: score_text,
      //       });
      //     });
      //     ALERT.findWidget("title_home").forEach((w) => {
      //       w.setVisibility("false");
      //     });
      //     ALERT.findWidget("title_away").forEach((w) => {
      //       w.setVisibility("false");
      //     });
      //   } else {
      //     ALERT.findWidget("show_scores").forEach((w) => {
      //       w.setPayload({
      //         text: "vs",
      //       });
      //     });
      //     ALERT.findWidget("title_home").forEach((w) => {
      //       w.setVisibility("true");
      //     });
      //     ALERT.findWidget("title_away").forEach((w) => {
      //       w.setVisibility("true");
      //     });
      //   }
      //   ALERT.findWidget("text").forEach((w) => {
      //     w.setPayload({
      //       text: alert_control_node["bottom_text"],
      //     });
      //   });
      // }

      function updateUI() {
        const away_team = GAMEINFO.getModel()
          .find((i) => i.id === "Opponent")
          ["selections"].find(
            (t) => t.id === CONTROLNODES.game_info["Opponent"],
          );
        console.log("away team: " + away_team.title);

        let colors = ["color_primary", "color_secondary"];
        SUBCOMPS.forEach((sub_comp) => {
          // colors.forEach((color) => {
          //   let widgets = sub_comp.findWidget(color);
          //   widgets.forEach((w) => {
          //     w.setPayload({
          //       fillGradient: {
          //         solidColor: CONTROLNODES.game_info[color],
          //       },
          //     });
          //   });
          // });

          sub_comp.findWidget("title_away").forEach((w) => {
            w.setPayload({
              text: away_team["title"],
            });
          });
          // sub_comp.findWidget("abbr_away").forEach((w) => {
          //   w.setPayload({
          //     text: away_team["abbreviation"],
          //   });
          // });
          // sub_comp.findWidget("score_away").forEach((w) => {
          //   w.setPayload({
          //     text: score_data["away_score"],
          //   });
          // });
          // sub_comp.findWidget("score_home").forEach((w) => {
          //   w.setPayload({
          //     text: score_data["home_score"]w
          //   });
          // });
          sub_comp.findWidget("icon_away").forEach((w) => {
            w.setPayload({
              image: away_team["icon"],
            });
          });
        });

        updateThumbnail();
        // updateScoreBug();
        // updateAlert();
      }

      function updateNodeObject(node, payload) {
        Object.entries(payload).forEach(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            updateNodeObject(node[key], value);
          } else {
            node[key] = value;
          }
        });
      }

      GAMEINFO.addListener("payload_changed", (event, msg, e) => {
        console.log(CONTROLNODES.game_info);
        // let game_info_control_node = GAMEINFO.getControlNode().payload;
        // for (const key in msg.payload) {
        //   if (game_info_control_node[key] !== msg.payload[key]) {
        //     game_info_control_node[key] = msg.payload[key];
        //   }
        // }
        // game_info_control_node = checkDifference(game_info_control_node, msg.payload);
        // away_team = away_teams.find(
        //   (t) => t.id === game_info_control_node["Opponent"],
        // );
        // updateNodeObject(CONTROLNODES.game_info, msg.payload);
        // console.log(CONTROLNODES.game_info);
        updateUI();
        e.stopPropagation();
      });

      // SCOREBUG.addListener("payload_changed", (event, msg, e) => {
      //   for (const key in msg.payload) {
      //     if (score_bug_control_node[key] !== msg.payload[key]) {
      //       score_bug_control_node[key] = msg.payload[key];
      //     }
      //   }
      //   score_bug_style = score_bug_styles.find(
      //     (s) => s.id === score_bug_control_node["score_bug_style"],
      //   );
      //   power_play = power_play_selections.find(
      //     (s) => s.id === score_bug_control_node["power_play"],
      //   ).id;
      //   empty_net = empty_net_selections.find(
      //     (s) => s.id === score_bug_control_node["empty_net"],
      //   ).id;
      //   updateUI();
      //   e.stopPropagation();
      // });

      // ALERT.addListener("payload_changed", (event, msg, e) => {
      //   for (const key in msg.payload) {
      //     if (alert_control_node[key] !== msg.payload[key]) {
      //       alert_control_node[key] = msg.payload[key];
      //     }
      //   }
      //   updateUI();
      //   e.stopPropagation();
      // });

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
