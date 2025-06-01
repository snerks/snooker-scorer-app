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

  const nextColor = getNextColor(redsLeft, colorsOnTable);

  function handlePot(ball: string) {
    if (frameOver) return;
    let value = BALLS.find(b => b.name === ball)?.value || 0;
    let newRedsLeft = redsLeft;
    let newColorsOnTable = { ...colorsOnTable };
    let newHistory = [...history];
    let action = `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'} potted ${ball} (+${value})`;

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
    // Frame is only over when all colors have been potted (i.e., all are false)
    // and the last potted ball was the black
    const allColorsGone = Object.values(newColorsOnTable).every(v => !v);
    const lastPottedBlack = newHistory.length > 0 && newHistory[newHistory.length - 1].includes('potted Black');
    if (newRedsLeft === 0 && allColorsGone && lastPottedBlack) {
      setFrameOver(true);
    }
  }

  function handleFoul(points: number) {
    if (frameOver) return;
    const otherPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    setScores(s => ({ ...s, [otherPlayer]: s[otherPlayer] + points }));
    setBreakScore(0);
    setHistory([...history, `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'} foul (${points})`]);
    setCurrentPlayer(otherPlayer);
  }

  function endTurn() {
    if (frameOver) return;
    setBreakScore(0);
    setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1');
    setHistory([...history, `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'} ended turn`]);
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
  if (redsLeft > 0) {
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
    <div className="snooker-table-bg">
      <h2>Snooker Frame Scorer</h2>
      <div>
        <strong>Player 1:</strong> {scores.player1} {currentPlayer === 'player1' && '(at table)'}<br />
        <strong>Player 2:</strong> {scores.player2} {currentPlayer === 'player2' && '(at table)'}
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Break:</strong> {breakScore}
      </div>
      <div>
        <strong>Reds left:</strong> {redsLeft}<br />
        <strong>Colors on table:</strong> {(Object.entries(colorsOnTable).filter(([_, v]) => v).map(([k]) => k).join(', ')) || 'None'}
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Pot ball:</strong><br />
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
      {frameOver && <div style={{ color: 'red', fontWeight: 'bold' }}>Frame Over!</div>}
      <div style={{ textAlign: 'left', marginTop: 16 }}>
        <strong>History:</strong>
        <ul>
          {history.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default SnookerScorer;
