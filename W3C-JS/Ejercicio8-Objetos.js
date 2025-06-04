let persona = {
  // Declara un objeto llamado 'persona' con varias propiedades

  nombre: "Carlos",
  // Propiedad 'nombre' con el valor "Carlos"

  edad: 28,
  // Propiedad 'edad' con el valor numérico 28

  saludar: function() {
    // Propiedad 'saludar' que es una función (método del objeto)
    console.log("Hola, soy " + this.nombre);
    // Imprime un saludo usando 'this.nombre' para acceder a la propiedad 'nombre' del mismo objeto
  }
};

persona.saludar();
// Llama al método 'saludar' del objeto 'persona', que imprimirá: "Hola, soy Carlos"
