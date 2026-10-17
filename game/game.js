// Read-only game page for a fixture link (BACKEND_FIRST_SLICE.md step 5).
// The link looks like https://matchtempo.app/game/#<token>. The token stays in the
// fragment, so it never reaches a server log or a Referer header; the page POSTs it
// to play.read_fixture_by_link with the publishable key and draws what comes back.
// Everything shown is set with textContent: names are typed by organisers.
(function () {
  'use strict';

  // Kit colours from board P (p5-team-colours). Keys are lower case with spaces and
  // dashes removed, so "Royal blue" and "royalBlue" both match.
  var KIT = {
    yellow: '#F2C230', green: '#2FA866', skyblue: '#7CC0F0', royalblue: '#3D6BE0',
    navy: '#1C2E5A', purple: '#6B3FA0', white: '#F4F4F0', black: '#141414',
    red: '#D32F2F', claret: '#7A1F3D', orange: '#E8822A', grey: '#8C8C88', gray: '#8C8C88',
    fluoroyellow: '#E8FF2E', fluorogreen: '#4CFF5E', fluoropink: '#FF3EA5',
    fluoroorange: '#FF5A14', fluoroblue: '#2E9BFF'
  };
  var NO_KIT = '#E3DFD6';

  function kitColour(kit, fallback) {
    var name = kit && typeof kit.main === 'string' ? kit.main : fallback;
    var key = String(name || '').toLowerCase().replace(/[\s_-]/g, '');
    return KIT[key] || NO_KIT;
  }

  // Dark text on light kits, white on dark ones (relative luminance, WCAG).
  function textOn(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return l > 0.25 ? '#0B0B0A' : '#FFFFFF';
  }

  // Organisers name sides "Yellows" and "Blues" by default; use that word when the
  // kit has no colour so the tile still matches what players call their side.
  function sideFallback(name) {
    var n = String(name || '').toLowerCase();
    if (n.indexOf('yellow') === 0) return 'yellow';
    if (n.indexOf('blue') === 0) return 'royalblue';
    return '';
  }

  function when(iso, timeZone) {
    var date = new Date(iso);
    var zone = timeZone || 'Europe/London';
    var day, time;
    try {
      day = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(date);
      time = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    } catch (e) {
      day = date.toUTCString().slice(0, 11);
      time = date.toUTCString().slice(17, 22);
    }
    return { day: day.replace(',', ''), time: time };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function section(title) {
    var s = el('section', 'section');
    s.appendChild(el('h2', 'label', title));
    return s;
  }

  // Directions (board AQ2). The page can't tell which apps are installed, so it lists
  // all three as links; Apple Maps only on Apple devices (iPad reports Macintosh).
  // Each link carries only the venue, so nothing about the trip comes back to us.
  function directionLinks(data, ua) {
    var loc = data.venue_location;
    var point = loc && isFinite(loc.latitude) && isFinite(loc.longitude) ? loc.latitude + ',' + loc.longitude : null;
    var query = [data.venue, data.venue_address].filter(Boolean).join(', ');
    var to = encodeURIComponent(point || query);
    var links = [];
    if (/iPhone|iPad|iPod|Macintosh/.test(ua || '')) {
      links.push({ name: 'Apple Maps', note: 'On iPhone, iPad and Mac',
                   href: 'https://maps.apple.com/?daddr=' + to + '&q=' + encodeURIComponent(data.venue || '') });
    }
    links.push({ name: 'Google Maps', note: 'App or website',
                 href: 'https://www.google.com/maps/dir/?api=1&destination=' + to });
    links.push({ name: 'Waze', note: 'App or website',
                 href: point ? 'https://waze.com/ul?ll=' + to + '&navigate=yes' : 'https://waze.com/ul?q=' + to + '&navigate=yes' });
    return links;
  }

  function icon(d) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }
  var TURN = 'M12 2.5 21.5 12 12 21.5 2.5 12Z M9 15v-3.5h6 M12.5 9l2.5 2.5-2.5 2.5';
  var PIN = 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z';

  function venueCard(data, showDirections) {
    var card = el('div', 'venue');
    card.appendChild(el('h2', 'label', 'Venue'));
    card.appendChild(el('p', 'venue-name', data.venue));
    var line = [data.pitch, data.venue_address].filter(Boolean).join(' · ');
    if (line) card.appendChild(el('p', 'venue-line', line));
    if (!showDirections) return card;

    var sheet = el('dialog', 'sheet');
    sheet.setAttribute('aria-label', 'Directions to ' + data.venue);
    sheet.appendChild(el('h2', 'sheet-title', 'Directions to ' + data.venue));
    directionLinks(data, navigator.userAgent).forEach(function (link) {
      var a = el('a', 'app');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      var ic = el('span', 'app-icon');
      ic.appendChild(icon(PIN));
      a.appendChild(ic);
      var words = el('span', 'app-words');
      words.appendChild(el('span', 'app-name', link.name));
      words.appendChild(el('span', 'app-note', link.note));
      a.appendChild(words);
      a.appendChild(el('span', 'app-go', '›'));
      sheet.appendChild(a);
    });
    sheet.appendChild(el('p', 'sheet-note', 'Opens a maps link. MatchTempo doesn’t see your route.'));
    var cancel = el('button', 'sheet-cancel', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', function () { sheet.close(); });
    sheet.appendChild(cancel);
    // A tap on the dimmed page outside the sheet closes it too.
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

    var button = el('button', 'directions');
    button.type = 'button';
    button.setAttribute('aria-label', 'Directions to ' + data.venue);
    button.appendChild(icon(TURN));
    button.appendChild(el('span', '', 'Directions'));
    button.addEventListener('click', function () { sheet.showModal(); });
    card.appendChild(button);
    card.appendChild(sheet);
    return card;
  }

  function render(data, root) {
    root.textContent = '';
    document.getElementById('group').textContent = data.group_name || '';
    document.title = (data.group_name ? data.group_name + ' · ' : '') + 'MatchTempo';

    var w = when(data.kick_off, data.time_zone);
    var sides = data.sides || {};
    var a = sides.a || {}, b = sides.b || {};
    var result = data.result;
    var cancelled = data.status === 'cancelled';
    var voided = data.status === 'void';

    root.appendChild(el('h1', 'day', w.day));
    root.appendChild(el('p', 'meta', data.venue ? w.time : [w.time, data.pitch].filter(Boolean).join(' · ')));

    if (cancelled) root.appendChild(el('p', 'notice', 'This game was cancelled.'));
    // A void game keeps its score and teams as a record, but nothing from it counts.
    if (voided) root.appendChild(el('p', 'notice', 'This game was made void. Its result doesn’t count in the table.'));

    var tiles = el('div', 'tiles');
    [['a', a], ['b', b]].forEach(function (pair) {
      var key = pair[0], side = pair[1];
      var fill = kitColour(side.kit, sideFallback(side.name));
      var tile = el('div', 'tile');
      tile.style.backgroundColor = fill;
      tile.style.color = textOn(fill);
      if (fill === KIT.white) tile.classList.add('tile-light');
      tile.appendChild(el('span', 'tile-name', side.name || (key === 'a' ? 'Side A' : 'Side B')));
      if (result) tile.appendChild(el('span', 'tile-score', key === 'a' ? result.score_a : result.score_b));
      tiles.appendChild(tile);
    });
    root.appendChild(tiles);

    if (!result && !cancelled && !voided) {
      var started = new Date(data.kick_off).getTime() <= Date.now();
      root.appendChild(el('p', 'meta', started ? 'No result yet.' : 'Not played yet.'));
    }

    if (result) {
      if (result.player_of_match) {
        var potm = section('Player of the Match');
        potm.appendChild(el('div', 'row row-strong', result.player_of_match));
        root.appendChild(potm);
      }

      var scorers = result.scorers || [];
      var ownGoals = result.own_goals || [];
      if (scorers.length || ownGoals.length) {
        var goals = section('Goals');
        scorers.forEach(function (g) {
          var row = el('div', 'row');
          row.appendChild(el('span', 'row-name', g.name));
          row.appendChild(el('span', 'row-side', (g.side === 'a' ? a.name : b.name) || ''));
          row.appendChild(el('span', 'row-count', g.goals));
          goals.appendChild(row);
        });
        ownGoals.forEach(function (o) {
          var row = el('div', 'row');
          row.appendChild(el('span', 'row-name', o.by ? 'Own goal by ' + o.by : 'Own goal'));
          row.appendChild(el('span', 'row-side', 'for ' + ((o.side === 'a' ? a.name : b.name) || '')));
          row.appendChild(el('span', 'row-count', 1));
          goals.appendChild(row);
        });
        root.appendChild(goals);
      } else if (result.score_a + result.score_b > 0) {
        root.appendChild(el('p', 'meta', 'Scorers not recorded.'));
      }
    }

    if (data.venue) root.appendChild(venueCard(data, !cancelled));

    var teams = data.teams || {};
    var teamA = teams.a || [], teamB = teams.b || [];
    if (!cancelled) {
      var t = section(data.teams_confirmed || !(teamA.length || teamB.length) ? 'Teams' : 'Teams · not confirmed yet');
      if (!teamA.length && !teamB.length) {
        t.appendChild(el('p', 'meta', 'Teams not picked yet.'));
      } else {
        var cols = el('div', 'teams');
        [[a, teamA, 'a'], [b, teamB, 'b']].forEach(function (pair) {
          var col = el('div', 'team');
          var head = el('div', 'team-head');
          var chip = el('span', 'chip');
          chip.style.backgroundColor = kitColour(pair[0].kit, sideFallback(pair[0].name));
          head.appendChild(chip);
          head.appendChild(el('span', '', pair[0].name || ''));
          col.appendChild(head);
          var list = el('ul', 'names');
          pair[1].forEach(function (name) { list.appendChild(el('li', '', name)); });
          col.appendChild(list);
          cols.appendChild(col);
        });
        t.appendChild(cols);
      }
      root.appendChild(t);
    }

    root.appendChild(el('p', 'small', 'Only people with this link can see this page. The organiser can turn it off.'));
  }

  function showMessage(root, text) {
    root.textContent = '';
    root.appendChild(el('p', 'message', text));
  }

  var UNAVAILABLE = 'This link isn’t available. It may have expired or the organiser may have turned it off. Ask them for a new one.';

  function tokenFromHash(hash) {
    var t = String(hash || '').replace(/^#/, '');
    return /^[A-Za-z0-9_-]{43}$/.test(t) ? t : null;
  }

  function load() {
    var root = document.getElementById('game');
    var config = window.MATCHTEMPO_CONFIG || {};
    var token = tokenFromHash(window.location.hash);
    if (!token) return showMessage(root, UNAVAILABLE);
    if (!config.supabaseUrl || !config.publishableKey) {
      return showMessage(root, 'This page isn’t set up yet.');
    }

    fetch(config.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/read_fixture_by_link', {
      method: 'POST',
      headers: {
        'apikey': config.publishableKey,
        'Content-Type': 'application/json',
        'Content-Profile': 'play',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ p_token: token }),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    }).then(function (response) {
      if (response.status >= 400 && response.status < 500) throw new Error('unavailable');
      if (!response.ok) throw new Error('failed');
      return response.json();
    }).then(function (data) {
      if (!data || typeof data !== 'object' || !data.kick_off) throw new Error('unavailable');
      render(data, root);
    }).catch(function (error) {
      showMessage(root, error && error.message === 'unavailable'
        ? UNAVAILABLE
        : 'The game couldn’t load. Check your connection and reload the page.');
    });
  }

  window.addEventListener('hashchange', load);
  load();
})();
