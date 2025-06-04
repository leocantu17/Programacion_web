class Animal {
  constructor(nombre) {
    this.nombre = nombre;
  }

  hablar() {
    console.log(this.nombre + " hace un sonido.");
  }
}

let perro = new Animal("Firulais");
perro.hablar();
