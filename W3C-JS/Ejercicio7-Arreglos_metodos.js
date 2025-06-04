let frutas = ["Manzana", "Banana", "Cereza"];
// Declara un arreglo llamado 'frutas' con tres elementos: "Manzana", "Banana" y "Cereza"

frutas.push("Durazno");
// Agrega un nuevo elemento al final del arreglo: "Durazno"

console.log(frutas);
// Imprime todo el contenido del arreglo actualizado: ["Manzana", "Banana", "Cereza", "Durazno"]

frutas.forEach(function(fruta) {
  // Recorre cada elemento del arreglo 'frutas' usando el método forEach
  // 'fruta' representa el valor actual del elemento en cada iteración
  console.log(fruta);
  // Imprime cada fruta individualmente en la consola
});
