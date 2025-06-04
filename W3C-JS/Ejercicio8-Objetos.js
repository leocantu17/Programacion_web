let persona = {
  nombre: "Carlos",
  edad: 28,
  saludar: function() {
    console.log("Hola, soy " + this.nombre);
  }
};

persona.saludar();
