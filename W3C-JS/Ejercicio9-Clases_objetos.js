class Animal {
  // Define una clase llamada 'Animal'

  constructor(nombre) {
    // El constructor se ejecuta cuando se crea una nueva instancia de la clase
    this.nombre = nombre;
    // Asigna el valor del parámetro 'nombre' a la propiedad 'nombre' del objeto
  }

  hablar() {
    // Define un método llamado 'hablar' dentro de la clase
    console.log(this.nombre + " hace un sonido.");
    // Imprime en la consola un mensaje usando el nombre del animal
  }
}

let perro = new Animal("Firulais");
// Crea una nueva instancia de la clase Animal con el nombre "Firulais" y la guarda en la variable 'perro'

perro.hablar();
// Llama al método 'hablar' del objeto 'perro', que imprimirá: "Firulais hace un sonido."
