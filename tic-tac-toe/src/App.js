import './App.css';
import { useState } from 'react';

// Componente Square: representa un solo cuadro en el tablero.
function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

// Componente Board: representa el tablero del juego.
function Board({ xIsNext, squares, onPlay }) {
  // Maneja el clic en un cuadro del tablero.
  function handleClick(i) {
    // Si hay un ganador o el cuadro ya está ocupado, no hacer nada.
    if (calculateWinner(squares) || squares[i]) {
      return;
    }

    // Crear una nueva copia del arreglo de cuadros.
    const nextSquares = squares.slice();

    // Asigna 'X' o 'O' según el turno.
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }

    // Llama a la función para actualizar el estado del juego.
    onPlay(nextSquares);
  }

  // Verifica si hay un ganador.
  const winner = calculateWinner(squares);

  // Muestra el estado actual del juego (ganador o siguiente jugador).
  let status;
  if (winner) {
    status = 'Ganador: ' + winner;
  } else {
    status = 'Siguiente jugador: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className="status">{status}</div>
      {/* Renderiza el tablero con 9 cuadros en una cuadrícula 3x3 */}
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

// Componente principal del juego.
export default function Game() {
  // Estado que almacena el historial de movimientos.
  const [history, setHistory] = useState([Array(9).fill(null)]);

  // Estado que indica el movimiento actual.
  const [currentMove, setCurrentMove] = useState(0);

  // Determina si el siguiente jugador es 'X' o 'O'.
  const xIsNext = currentMove % 2 === 0;

  // Obtiene el estado actual del tablero.
  const currentSquares = history[currentMove];

  // Maneja un nuevo movimiento en el juego.
  function handlePlay(nextSquares) {
    // Crea un nuevo historial truncando los movimientos posteriores al actual.
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];

    // Actualiza el historial y el movimiento actual.
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  // Permite retroceder a un movimiento anterior.
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  // Crea la lista de movimientos para la historia del juego.
  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Ir al movimiento #' + move;
    } else {
      description = 'Ir al inicio del juego';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        {/* Renderiza el tablero con la configuración actual */}
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        {/* Muestra el historial de movimientos */}
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

// Función para determinar si hay un ganador.
function calculateWinner(squares) {
  // Todas las combinaciones ganadoras posibles en un tablero de 3x3.
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // Recorre todas las combinaciones posibles y verifica si hay un ganador.
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]; // Retorna el símbolo del jugador que ganó ('X' o 'O').
    }
  }
  return null; // No hay ganador.
}
