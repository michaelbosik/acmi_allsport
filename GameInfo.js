(function() {
  let datastream;
  return {
    init: function(comp, context) {
      console.log("Initialize Composition script " + comp.name);

      const GAMEINFO = comp.parent().find("Game Info")[0];
      const THUMBNAIL = comp.parent().find('Thumbnail')[0];
      const SCOREBUG = comp.parent().find('Score Bug')[0];
      const LOWERMATCHUP = comp.parent().find('Lower Match Up')[0];

      let game_info_control_node = GAMEINFO.getControlNode().payload;
      let score_bug_control_node = SCOREBUG.getControlNode().payload;
      let lower_matchup_control_node = LOWERMATCHUP.getControlNode().payload;

      const away_teams = GAMEINFO.getModel().find(i => i.id === 'Opponent')['selections'];
      let away_team = away_teams.find(t => t.id === game_info_control_node['Opponent']);

      const score_bug_styles = SCOREBUG.getModel().find(i => i.id === 'ScoreBug Style')['selections'];
      let score_bug_style = score_bug_styles.find(s => s.id === game_info_control_node['ScoreBug Style']);

      let score_data = {
        'minutes': 0,
        'seconds': 0,
        'timer_stopped': false,
        'home_score': 0,
        'away_score': 0,
        'home_fouls': 0,
        'away_fouls': 0,
        'period': 1
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
            'text': away_team['abreviation']
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
          // ADD SCORES TO LOWER MATCH UP
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

      function updateUI() {
        updateThumbnail();
        updateScoreBug();
        updateLowerMatchUp();
      }

      GAMEINFO.addListener('payload_changed', (event, msg, e) => {
        game_info_control_node = comp.getControlNode().payload;
        away_team = away_teams.find(t => t.id === game_info_control_node['Opponent']);
        updateUI();
        e.stopPropagation();
      });

      SCOREBUG.addListener('payload_changed', (event, msg, e) => {
        score_bug_control_node = SCOREBUG.getControlNode().payload;
        score_bug_style = score_bug_styles.find(s => s.id === game_info_control_node['ScoreBug Style']);
        updateUI();
        e.stopPropagation();
      });

      LOWERMATCHUP.addListener('payload_changed', (event, msg, e) => {
        lower_matchup_control_node = LOWERMATCHUP.getControlNode().payload;
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
