import React, { useState } from 'react';

// Ball values according to WPBSA rules
const BALLS = [
  { name: 'Red', value: 1, count: 15 },
  { name: 'Yellow', value: 2, count: 1 },
  { name: 'Green', value: 3, count: 1 },
  { name: 'Brown', value: 4, count: 1 },
  { name: 'Blue', value: 5, count: 1 },
  { name: 'Pink', value: 6, count: 1 },
  { name: 'Black', value: 7, count: 1 },
];

const initialReds = 15;
type ColorName = 'Yellow' | 'Green' | 'Brown' | 'Blue' | 'Pink' | 'Black';

const initialColors: Record<ColorName, boolean> = {
  Yellow: true,
  Green: true,
  Brown: true,
  Blue: true,
  Pink: true,
  Black: true,
};

function getNextColor(redsLeft: number, colorsOnTable: Record<ColorName, boolean>) {
  if (redsLeft > 0) return 'Red';
  // After all reds, colors must be potted in order: Yellow, Green, Brown, Blue, Pink, Black
  const order: ColorName[] = ['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'];
  for (const color of order) {
    if (colorsOnTable[color]) return color;
  }
  return null;
}

const SnookerScorer: React.FC = () => {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [colorsOnTable, setColorsOnTable] = useState<Record<ColorName, boolean>>({ ...initialColors });
  const [redsLeft, setRedsLeft] = useState(initialReds);
  // const [colorsOnTable, setColorsOnTable] = useState({ ...initialColors });
  const [breakScore, setBreakScore] = useState(0);
  const [frameOver, setFrameOver] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1');
  // Add state for respotted black and who is at table after tie
  const [respottedBlack, setRespottedBlack] = useState(false);
  const [coinTossWinner, setCoinTossWinner] = useState<'player1' | 'player2' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [playerNames, setPlayerNames] = useState<{ player1: string; player2: string }>({ player1: 'Player 1', player2: 'Player 2' });

  // const nextColor =
  getNextColor(redsLeft, colorsOnTable);

  function handlePot(ball: string) {
    if (frameOver && !respottedBlack) return;
    let value = BALLS.find(b => b.name === ball)?.value || 0;
    let newRedsLeft = redsLeft;
    let newColorsOnTable = { ...colorsOnTable };
    let newHistory = [...history];
    let action = `${currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2} potted ${ball} (+${value})`;

    if (ball === 'Red') {
      if (redsLeft === 0) return;
      newRedsLeft--;
      // Do not remove any color from table when potting a red
    } else if (redsLeft > 0) {
      // Color after red, respot: do NOT remove from table
      // No action needed here
    } else {
      // Colors in order, remove from table
      // But: after final red, the next color is a free choice and should NOT be removed
      // Only remove if all reds are gone AND not immediately after the final red
      const lastPottedRed =
        history.length > 0 &&
        history[history.length - 1].includes('potted Red') &&
        (history.filter(h => h.includes('potted Red')).length === initialReds);
      if (!lastPottedRed) {
        newColorsOnTable[ball as ColorName] = false;
      }
    }

    newHistory.push(action);
    setHistory(newHistory);
    setRedsLeft(newRedsLeft);
    setColorsOnTable(newColorsOnTable);
    setScores(s => ({ ...s, [currentPlayer]: s[currentPlayer] + value }));
    setBreakScore(b => b + value);

    // Check for frame end
    const allColorsGone = Object.values(newColorsOnTable).every(v => !v);
    const lastPottedBlack = newHistory.length > 0 && newHistory[newHistory.length - 1].includes('potted Black');
    if (!respottedBlack && newRedsLeft === 0 && allColorsGone && lastPottedBlack) {
      // Frame over, but check for tie
      if (scores.player1 + value === scores.player2 + value) {
        // Tie: respot black
        setRespottedBlack(true);
        setFrameOver(false);
        setColorsOnTable({ Yellow: false, Green: false, Brown: false, Blue: false, Pink: false, Black: true });
        setRedsLeft(0);
        setBreakScore(0);
        setCoinTossWinner(null);
        setHistory([...newHistory, 'Frame tied! Black respotted. Coin toss to decide who plays.']);
      } else {
        setFrameOver(true);
      }
    } else if (respottedBlack && ball === 'Black') {
      // Respotted black potted, frame over
      setFrameOver(true);
      setRespottedBlack(false);
    }
  }

  // Coin toss handler
  // function handleCoinToss() {
  //   if (!respottedBlack) return;
  //   const winner = Math.random() < 0.5 ? 'player1' : 'player2';
  //   setCoinTossWinner(winner);
  //   setCurrentPlayer(winner);
  //   setHistory([...history, `Coin toss: ${winner === 'player1' ? playerNames.player1 : playerNames.player2} to play from hand on respotted black.`]);
  // }

  function handleFoul(points: number) {
    if (frameOver) return;
    const otherPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    setScores(s => ({ ...s, [otherPlayer]: s[otherPlayer] + points }));
    setBreakScore(0);
    setHistory([...history, `${currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2} foul (${points})`]);
    setCurrentPlayer(otherPlayer);
  }

  function endTurn() {
    if (frameOver) return;
    setBreakScore(0);
    setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1');
    setHistory([...history, `${currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2} ended turn`]);
  }

  function resetFrame() {
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer('player1');
    setRedsLeft(initialReds);
    setColorsOnTable({ ...initialColors });
    setBreakScore(0);
    setFrameOver(false);
    setHistory([]);
  }

  // Determine which balls are valid to pot
  let validBalls: string[] = [];
  if (respottedBlack) {
    if (!coinTossWinner) {
      validBalls = [];
    } else {
      validBalls = ['Black'];
    }
  } else if (redsLeft > 0) {
    // At the start of a break or after potting a color, only red is valid
    if (
      history.length === 0 ||
      history[history.length - 1].includes('ended turn') ||
      history[history.length - 1].includes('foul') ||
      (history[history.length - 1].includes('potted') && !history[history.length - 1].includes('Red'))
    ) {
      if (redsLeft > 0) validBalls = ['Red'];
    } else if (history[history.length - 1].includes('potted Red')) {
      // After potting a red, any color is valid
      validBalls = (['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'] as ColorName[]).filter(c => colorsOnTable[c]);
    }
  } else {
    // All reds gone: must pot colors in order
    // Special case: after potting the final red, player must pot a color of their choice before starting the color sequence
    // Check if the last potted ball was the final red
    const lastPottedRed =
      history.length > 0 &&
      history[history.length - 1].includes('potted Red') &&
      (history.filter(h => h.includes('potted Red')).length === initialReds);
    if (lastPottedRed) {
      // After final red, any color is valid
      validBalls = (['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'] as ColorName[]).filter(c => colorsOnTable[c]);
    } else {
      // Otherwise, must pot colors in order
      const order: ColorName[] = ['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'];
      const next = order.find(c => colorsOnTable[c]);
      if (next) validBalls = [next];
    }
  }

  return (
    <div className="snooker-table-bg" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
      <h2>Snooker Frame Scorer</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <label>
          <span style={{ marginRight: 4 }}>Player 1:</span>
          <input
            type="text"
            value={playerNames.player1}
            onChange={e => setPlayerNames(n => ({ ...n, player1: e.target.value }))}
            style={{ width: 140, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', fontSize: '1.1em' }}
            maxLength={20}
          />
        </label>
        <label>
          <span style={{ marginRight: 4 }}>Player 2:</span>
          <input
            type="text"
            value={playerNames.player2}
            onChange={e => setPlayerNames(n => ({ ...n, player2: e.target.value }))}
            style={{ width: 140, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', fontSize: '1.1em' }}
            maxLength={20}
          />
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ textAlign: 'left', width: 340, border: '2px solid #bfa14a', borderRadius: 10, background: 'linear-gradient(90deg, #f7f3e3 80%, #e6d8b8 100%)', boxShadow: '0 2px 8px #0002', padding: '16px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(['player1', 'player2'] as const).map((p) => (
              <div key={p} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                <div style={{ width: 120, fontWeight: 'bold', fontSize: '1.08em' }}>{playerNames[p]}</div>
                <div style={{ width: 60, fontVariantNumeric: 'tabular-nums', fontSize: '1.08em' }}>{scores[p]}</div>
                <div style={{ width: 60, color: currentPlayer === p ? 'green' : '#888', textAlign: 'left', fontWeight: currentPlayer === p ? 'bold' : 'normal' }}>
                  {currentPlayer === p ? '●' : ''}
                </div>
                <div style={{ width: 80, color: '#333', fontSize: '0.98em', textAlign: 'left' }}>
                  {currentPlayer === p && <><strong>Break:</strong> {breakScore}</>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <strong style={{ marginRight: 4 }}>
          <span className="snooker-ball red" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1em', width: 32, height: 32 }}>
            {redsLeft}
          </span>
        </strong>
        <span style={{ marginLeft: 6 }}><strong>Reds left</strong></span>
        <br />
        <div style={{ height: 12 }} />
        <strong>Colours on table:</strong>{' '}
        {(['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'] as ColorName[])
          .filter(color => colorsOnTable[color])
          .map(color => (
            <span
              key={color}
              className={`snooker-ball ${color.toLowerCase()}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.1em',
                marginRight: 4,
              }}
              title={color}
            >
              {/* Optionally show first letter or leave empty for just colour */}
            </span>
          ))
        }
        {(['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'] as ColorName[]).every(color => !colorsOnTable[color]) && 'None'}
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Pot ball</strong><br />
        {BALLS.filter(b => validBalls.includes(b.name)).map(ball => (
          <button key={ball.name} onClick={() => handlePot(ball.name)} style={{ margin: 4, padding: 0, border: 'none', background: 'none' }}>
            <span className={`snooker-ball ${ball.name.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1em' }}>
              {ball.value}
            </span>
          </button>
        ))}
      </div>
      <div>
        <strong>Foul:</strong>
        {[4, 5, 6, 7].map(points => (
          <button key={points} onClick={() => handleFoul(points)} style={{ margin: 4 }}>
            {points}
          </button>
        ))}
      </div>
      <div style={{ margin: '1em 0' }}>
        <button onClick={endTurn}>End Turn</button>
        <button onClick={resetFrame} style={{ marginLeft: 8 }}>Reset Frame</button>
      </div>
      {frameOver && !respottedBlack && (
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          Frame Over!<br />
          {scores.player1 === scores.player2
            ? "It's a tie!<br />Black is respotted. Coin toss to decide who plays."
            : scores.player1 > scores.player2
              ? `${playerNames.player1} wins!`
              : `${playerNames.player2} wins!`}
        </div>
      )}
      {respottedBlack && (
        <div style={{ color: 'red', fontWeight: 'bold', marginTop: 12 }}>
          Black respotted!<br />
          {coinTossWinner === null ? (
            <div style={{ marginTop: 8 }}>
              <span>Select coin toss winner: </span>
              <button onClick={() => { setCoinTossWinner('player1'); setCurrentPlayer('player1'); setHistory([...history, `Coin toss: ${playerNames.player1} to play from hand on respotted black.`]); }} style={{ fontWeight: 'bold', marginRight: 8 }}>{playerNames.player1}</button>
              <button onClick={() => { setCoinTossWinner('player2'); setCurrentPlayer('player2'); setHistory([...history, `Coin toss: ${playerNames.player2} to play from hand on respotted black.`]); }} style={{ fontWeight: 'bold' }}>{playerNames.player2}</button>
            </div>
          ) : (
            <span>{coinTossWinner === 'player1' ? playerNames.player1 : playerNames.player2} to play from hand.</span>
          )}
        </div>
      )}
      <div style={{ textAlign: 'left', marginTop: 16 }}>
        <button onClick={() => setShowHistory(v => !v)} style={{ marginBottom: 8 }}>
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
        {showHistory && (
          <>
            {/* <strong>History:</strong> */}
            <ul>
              {history.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default SnookerScorer;
