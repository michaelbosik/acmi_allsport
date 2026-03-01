(function() {
  let datastream;
  return {
    init: function(comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find('Thumbnail')[0];
      const SCOREBUG = comp.parent().find('Score Bug')[0];
      const LOGO = comp.parent().find('Logo')[0];
      const LOWERMATCHUP = comp.parent().find('Lower Match Up')[0];
      const TIMEOUT = comp.parent().find('Timeout')[0];
      const POWERPLAY = SCOREBUG.find('PowerPlay')[0];

      let game_info_control_node = GAMEINFO.getControlNode().payload;
      let score_bug_control_node = SCOREBUG.getControlNode().payload;
      let lower_matchup_control_node = LOWERMATCHUP.getControlNode().payload;
      let logo_control_node = LOGO.getControlNode().payload;
      // let timeout_control_node = TIMEOUT.getControlNode().payload;

      const away_teams = GAMEINFO.getModel().find(i => i.id === 'Opponent')['selections'];
      let away_team = away_teams.find(t => t.id === game_info_control_node['Opponent']);

      const score_bug_styles = SCOREBUG.getModel().find(i => i.id === 'ScoreBug Style')['selections'];
      let score_bug_style = score_bug_styles.find(s => s.id === score_bug_control_node['ScoreBug Style']);
      const power_play_selections = SCOREBUG.getModel().find(i => i.id === 'Power Play')['selections'];
      let power_play = power_play_selections.find(s => s.id === score_bug_control_node['Power Play']);

      let score_data = {
        'minutes': 0,
        'seconds': 0,
        'milliseconds': 0,
        'timer_stopped': false,
        'home_score': 0,
        'away_score': 0,
        'home_fouls': 0,
        'away_fouls': 0,
        'period': 1,
        'home_penalty_minutes': 0,
        'home_penalty_seconds': 0,
        'away_penalty_minutes': 0,
        'away_penalty_seconds': 0
      };

      datastream = context.utils.createDataStream("2RyUH29htuuAGDajfq2fkD",
        (status, payload) => {
          switch (status) {
            case "message":
              console.log("received data:", status, payload);
              score_data = payload.payload;
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
        });

      function manualUpdateScoreData() {
        score_data['minutes'] = parseInt(score_bug_control_node['reset_minutes']);
        score_data['seconds'] = parseInt(score_bug_control_node['reset_seconds']);
        score_data['home_score'] = parseInt(score_bug_control_node['home_score']);
        score_data['away_score'] = parseInt(score_bug_control_node['away_score']);
        score_data['period'] = parseInt(score_bug_control_node['period']);
        if (power_play === 'power_play_home') {
          score_data['away_penalty_seconds'] = 1;
          score_data['home_penalty_seconds'] = 0;
        } else if (power_play === 'power_play_away') {
          score_data['away_penalty_seconds'] = 0;
          score_data['home_penalty_seconds'] = 1;
        } else {
          score_data['away_penalty_seconds'] = 0;
          score_data['home_penalty_seconds'] = 0;
        }
      }

      function updateThumbnail() {
        THUMBNAIL.findWidget('Date')[0].setPayload({
          'text': game_info_control_node['Date']
        });

        THUMBNAIL.findWidget('AwayName')[0].setPayload({
          'text': away_team['title']
        });

        THUMBNAIL.findWidget('AwayIcon')[0].setPayload({
          'image': away_team['icon']
        });

        THUMBNAIL.findWidget('BOG')[0].setPayload({
          'text': game_info_control_node['BOG']
        });

        THUMBNAIL.findWidget('Sport')[0].setPayload({
          'image': game_info_control_node['Sport']
        });

        THUMBNAIL.findWidget('Background')[0].setPayload({
          'image': game_info_control_node['Location']
        });
      }

      function updateScoreBug() {

        score_bug_style = score_bug_styles.find(s => s.id === score_bug_control_node['ScoreBug Style']);
        score_bug_styles.forEach(s => {
          SCOREBUG.findGroup(s['style'])[0].setVisibility('false');
        });
        SCOREBUG.findGroup(score_bug_style['style'])[0].setVisibility('true');
        SCOREBUG.setPositionX(score_bug_style['position']['x']);
        SCOREBUG.setPositionY(score_bug_style['position']['y']);

        if (score_bug_control_node['manual_scoring']) {
          manualUpdateScoreData();
        }

        //also check for game to determine when OT is
        switch (score_data['period']) {
          case 1:
            score_data['period'] = '1st';
            break;
          case 2:
            score_data['period'] = '2nd';
            break;
          case 3:
            score_data['period'] = '3rd';
            break;
          case 4:
            score_data['period'] = '4th';
            break;
          default:
            score_data['period'] = 'OT';
            break;
        }

        if (score_data['home_penalty_seconds'] > 0 && score_data['away_penalty_seconds'] <= 0) {
          power_play = "power_play_away";
          POWERPLAY.setVisibility('true');
          POWERPLAY.setPositionX(score_bug_style['events'][power_play]['position']['x']);
          POWERPLAY.setPositionY(score_bug_style['events'][power_play]['position']['y']);
        } else if (score_data['away_penalty_seconds'] > 0 && score_data['home_penalty_seconds'] <= 0) {
          power_play = "power_play_home";
          POWERPLAY.setVisibility('true');
          POWERPLAY.setPositionX(score_bug_style['events'][power_play]['position']['x']);
          POWERPLAY.setPositionY(score_bug_style['events'][power_play]['position']['y']);
        } else {
          POWERPLAY.setVisibility('false');
        }


        SCOREBUG.findWidget('Primary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Primary']
            }
          });
        });
        SCOREBUG.findWidget('Secondary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Secondary']
            }
          });
        });
        SCOREBUG.findWidget('AwayName').forEach(e => {
          e.setPayload({
            'text': away_team['title']
          });
        });
        SCOREBUG.findWidget('AwayAbbr').forEach(e => {
          e.setPayload({
            'text': away_team['abbreviation']
          });
        });
        SCOREBUG.findWidget('AwayScore').forEach(e => {
          e.setPayload({
            'text': score_data['away_score']
          });
        });
        SCOREBUG.findWidget('HomeScore').forEach(e => {
          e.setPayload({
            'text': score_data['home_score']
          });
        });
        SCOREBUG.findWidget('Period').forEach(e => {
          e.setPayload({
            'text': score_data['period']
          });
        });
        SCOREBUG.findWidget('GameTimer').forEach(e => {
          e.setPayload({
            'timeControl': score_bug_control_node['game_timer'],
            'beginMinutes': score_data['minutes'],
            'beginSeconds': score_data['seconds']
          });
        });
      }

      function updateLowerMatchUp() {
        if (lower_matchup_control_node['show_scores']) {
          let score_text = `Arlington: ${score_data['home_score']}   VS   ${away_team['title']}: ${score_data['away_score']}`;
          LOWERMATCHUP.findWidget('Score')[0].setPayload({
            'text': score_text
          });
          LOWERMATCHUP.findWidget('HomeName')[0].setVisibility('false');
          LOWERMATCHUP.findWidget('AwayName')[0].setVisibility('false');
        } else {
          LOWERMATCHUP.findWidget('Score')[0].setPayload({
            'text': 'VS'
          });
          LOWERMATCHUP.findWidget('HomeName')[0].setVisibility('true');
          LOWERMATCHUP.findWidget('AwayName')[0].setVisibility('true');
        }

        LOWERMATCHUP.findWidget('Primary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Primary']
            }
          });
        });
        LOWERMATCHUP.findWidget('Secondary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Secondary']
            }
          });
        });
        LOWERMATCHUP.findWidget('AwayIcon')[0].setPayload({
          'image': away_team['icon']
        });
        LOWERMATCHUP.findWidget('AwayName')[0].setPayload({
          'text': away_team['title']
        });
        LOWERMATCHUP.findWidget('Subtext')[0].setPayload({
          'text': lower_matchup_control_node['lower_text']
        });
      }

      function updateLogo() {
        LOGO.findWidget('Logo')[0].setPayload({
          'image': logo_control_node['Logo']
        });
      }

      function updateTimeout() {
        TIMEOUT.findWidget('Primary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Primary']
            }
          });
        });
        TIMEOUT.findWidget('Secondary').forEach(e => {
          e.setPayload({
            'fillGradient': {
              'solidColor': game_info_control_node['Secondary']
            }
          });
        });
      }

      function updateUI() {
        updateThumbnail();
        updateScoreBug();
        updateLowerMatchUp();
        updateLogo();
        updateTimeout();
      }

      GAMEINFO.addListener('payload_changed', (event, msg, e) => {
        for (const key in msg.payload) {
          if (game_info_control_node[key] !== msg.payload[key]) {
            game_info_control_node[key] = msg.payload[key];
          }
        }
        away_team = away_teams.find(t => t.id === game_info_control_node['Opponent']);
        updateUI();
        e.stopPropagation();
      });

      SCOREBUG.addListener('payload_changed', (event, msg, e) => {
      	for (const key in msg.payload) {
      		if (score_bug_control_node[key] !== msg.payload[key]) {
      			score_bug_control_node[key] = msg.payload[key];
      		}
      	}
        score_bug_style = score_bug_styles.find(s => s.id === score_bug_control_node['ScoreBug Style']);
        power_play = power_play_selections.find(s => s.id === score_bug_control_node['Power Play'])['id'];
        updateUI();
        e.stopPropagation();
      });

      LOWERMATCHUP.addListener('payload_changed', (event, msg, e) => {
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
    close: function(comp, context) {
      console.log("Close Composition script " + comp.name);
      if (datastream) {
        datastream.close();
      }
    }
  };
})();
