let line = ' 0:00.0s 2 3   1 42    2:00          2:00       AF';

let selected_sport = 'hockey';

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

  function checkSpecial(key, raw){
    switch (key) {
      case 'timer_stopped':
        return raw === 's';
      case 'period':
        switch (raw) {
          case '1':
            return '1st';
          case '2':
            return '2nd';
          case '3':
            return '3rd';
          case '4':
            return '4th';
          case '5':
            return 'OT';
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
      else if (typeof value === 'object' && value !== null) {
        if (!targetObj[key]) targetObj[key] = {};
        applyIndexes(value, targetObj[key]);
      }
    }
  }

  applyIndexes(indexes, parsed_data);



  return parsed_data;
}

function print_object(object) {
  for (let [key, value] of Object.entries(object)) {
    if (typeof value === 'object' && value !== null) {
      print_object(value);
    } else {
      console.log(key + ': ' + value);
    }
  }
}

print_object(parse_line(line));
