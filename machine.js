/* ==========================================================================
   machine.js — two small interactions for machine.html
   1. the useless machine: a switch whose only purpose is to be switched off
   2. the target game: click the moving target as often as possible in 20 s
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- 1) toy */
  var toggle = document.querySelector('[data-switch]');
  if (toggle) {
    var arm = document.querySelector('[data-arm]');
    var counter = document.querySelector('[data-attempts]');
    var busy = false;
    var attempts = 0;

    var setOn = function (on) {
      toggle.classList.toggle('is-on', on);
      toggle.setAttribute('aria-checked', on ? 'true' : 'false');
    };

    setOn(false);

    toggle.addEventListener('click', function () {
      if (busy) {
        return;
      }
      busy = true;
      attempts += 1;
      if (counter) {
        counter.textContent = String(attempts);
      }
      setOn(true);

      /* the arm comes out and turns the switch off again */
      window.setTimeout(function () {
        if (arm) {
          arm.classList.add('is-out');
        }
      }, 380);

      window.setTimeout(function () {
        setOn(false);
        if (arm) {
          arm.classList.remove('is-out');
        }
      }, 1050);

      window.setTimeout(function () {
        busy = false;
      }, 1450);
    });
  }

  /* --------------------------------------------------------------- 2) game */
  var board = document.querySelector('[data-game]');
  if (!board) {
    return;
  }

  var target = board.querySelector('[data-target]');
  var scoreEl = document.querySelector('[data-score]');
  var timeEl = document.querySelector('[data-time]');
  var bestEl = document.querySelector('[data-best]');
  var message = document.querySelector('[data-message]');
  var startBtn = document.querySelector('[data-start]');
  var ROUND_MS = 20000;
  var score = 0;
  var endsAt = 0;
  var ticker = null;
  var playing = false;
  var bestKey = 'webtech-lab-best-score';

  var readBest = function () {
    try {
      return Number(window.localStorage.getItem(bestKey)) || 0;
    } catch (error) {
      return 0;
    }
  };

  var writeBest = function (value) {
    try {
      window.localStorage.setItem(bestKey, String(value));
    } catch (error) {
      /* storage can be blocked; the game still works without a best score */
    }
  };

  if (bestEl) {
    bestEl.textContent = String(readBest());
  }

  var moveTarget = function () {
    var size = target.offsetWidth || 62;
    var maxX = Math.max(0, board.clientWidth - size);
    var maxY = Math.max(0, board.clientHeight - size);
    target.style.left = Math.round(Math.random() * maxX) + 'px';
    target.style.top = Math.round(Math.random() * maxY) + 'px';
  };

  var stopGame = function () {
    playing = false;
    window.clearInterval(ticker);
    ticker = null;
    if (target) {
      target.hidden = true;
    }
    var best = readBest();
    if (score > best) {
      writeBest(score);
      best = score;
      if (bestEl) {
        bestEl.textContent = String(best);
      }
    }
    if (timeEl) {
      timeEl.textContent = '0.0';
    }
    if (message) {
      message.hidden = false;
      message.querySelector('[data-message-title]').textContent =
        'Time is up — ' + score + ' hit' + (score === 1 ? '' : 's');
    }
    if (startBtn) {
      startBtn.textContent = 'Play again';
    }
  };

  var startGame = function () {
    if (playing) {
      return;
    }
    score = 0;
    playing = true;
    endsAt = Date.now() + ROUND_MS;
    if (scoreEl) {
      scoreEl.textContent = '0';
    }
    if (message) {
      message.hidden = true;
    }
    if (target) {
      target.hidden = false;
    }
    moveTarget();
    if (startBtn) {
      startBtn.textContent = 'Restart';
    }
    ticker = window.setInterval(function () {
      var left = Math.max(0, endsAt - Date.now());
      if (timeEl) {
        timeEl.textContent = (left / 1000).toFixed(1);
      }
      if (left <= 0) {
        stopGame();
      }
    }, 100);
  };

  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  if (target) {
    target.hidden = true;
    target.addEventListener('click', function () {
      if (!playing) {
        return;
      }
      score += 1;
      if (scoreEl) {
        scoreEl.textContent = String(score);
      }
      moveTarget();
    });
  }

  /* keep the target inside the board when the window is resized */
  window.addEventListener('resize', function () {
    if (playing) {
      moveTarget();
    }
  });
})();
