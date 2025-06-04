let lista = document.getElementById("miLista");
// Obtiene el elemento del DOM con el id "miLista" (la lista <ul>) y lo guarda en la variable 'lista'

let nuevoElemento = document.createElement("li");
// Crea un nuevo elemento <li> (elemento de lista) y lo guarda en la variable 'nuevoElemento'

nuevoElemento.textContent = "Nuevo ítem";
// Establece el texto del nuevo <li> como "Nuevo ítem"

lista.appendChild(nuevoElemento);
// Agrega el nuevo <li> como hijo del elemento <ul>, es decir, lo inserta al final de la lista
