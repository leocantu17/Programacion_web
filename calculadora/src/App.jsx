import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // Estados para almacenar los números, operador y resultado
  const [numero1, setNumero1] = useState("");
  const [numero2, setNumero2] = useState("");
  const [operador, setOperador] = useState(null);
  const [resultado, setResultado] = useState(null);

  // Función para manejar la entrada de números
  const handleNumero = (num) => {
    if (resultado !== null) {
      limpiar(); // Si hay un resultado previo, limpiar antes de ingresar un nuevo número
      setNumero1(num);
    } else {
      if (operador === null) {
        setNumero1(numero1 + num); // Si no hay operador, agregar al primer número
      } else {
        setNumero2(numero2 + num); // Si ya hay operador, agregar al segundo número
      }
    }
  };

  // Función para manejar la selección del operador
  const handleOperacion = (op) => {
    if (numero1 !== "") {
      setOperador(op);
    }
  };

  // Función para calcular el resultado según el operador seleccionado
  const calcularResultado = () => {
    let res = 0;
    const num1 = parseFloat(numero1);
    const num2 = parseFloat(numero2);

    if (isNaN(num1) || isNaN(num2)) return; // Evitar cálculos si no hay números válidos

    switch (operador) {
      case "+":
        res = num1 + num2;
        break;
      case "-":
        res = num1 - num2;
        break;
      case "*":
        res = num1 * num2;
        break;
      case "/":
        res = num2 !== 0 ? num1 / num2 : "Error"; // Evitar división por cero
        break;
      case "%":
        res = num2 !== 0 ? num1 % num2 : "Error"; // Evitar módulo por cero
        break;
      default:
        return;
    }

    setResultado(res);
  };

  // Función para limpiar todos los valores
  const limpiar = () => {
    setNumero1("");
    setNumero2("");
    setOperador(null);
    setResultado(null);
  };

  // Función para manejar las entradas del teclado
  const handleKeyDown = (event) => {
    const { key } = event;

    if (!isNaN(key) || key === ".") {
      handleNumero(key);
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
      handleOperacion(key);
    } else if (key === "Enter") {
      calcularResultado();
    } else if (key === "Escape") {
      limpiar();
    }
  };

  // Agregar y remover el evento de teclado al montar/desmontar el componente
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [numero1, numero2, operador, resultado]);

  return (
    <div className="calculadora">
      {/* Muestra los números y el operador ingresado */}
      <div className="display">
        <h2>
          {resultado !== null
            ? resultado
            : numero1 + (operador ? ` ${operador} ` : "") + numero2}
        </h2>
      </div>

      {/* Botones de la calculadora */}
      <div className="botones">
        <button onClick={limpiar}>AC</button>
        <button onClick={() => handleNumero("7")}>7</button>
        <button onClick={() => handleNumero("8")}>8</button>
        <button onClick={() => handleNumero("9")}>9</button>
        <button onClick={() => handleOperacion("/")}>/</button>

        <button onClick={() => handleNumero("4")}>4</button>
        <button onClick={() => handleNumero("5")}>5</button>
        <button onClick={() => handleNumero("6")}>6</button>
        <button onClick={() => handleOperacion("*")}>*</button>

        <button onClick={() => handleNumero("1")}>1</button>
        <button onClick={() => handleNumero("2")}>2</button>
        <button onClick={() => handleNumero("3")}>3</button>
        <button onClick={() => handleOperacion("-")}>-</button>

        <button onClick={() => handleNumero("0")}>0</button>
        <button onClick={() => handleNumero(".")}>.</button>
        <button onClick={calcularResultado}>=</button>
        <button onClick={() => handleOperacion("+")}>+</button>
        <button onClick={() => handleOperacion("%")}>%</button>
      </div>
    </div>
  );
}

export default App;
