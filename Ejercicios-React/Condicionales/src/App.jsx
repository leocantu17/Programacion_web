// Componente Item que recibe props: name (nombre del ítem) e isPacked (si está empacado o no)
function Item({ name, isPacked }) {
  // Por defecto, se muestra el nombre tal como está
  let itemContent = name;

  // Si el ítem está empacado (isPacked === true), se muestra el nombre tachado y con un ícono ✅
  if (isPacked) {
    itemContent = (
      <del>
        {name + " ✅"} // Se concatena el ícono con el nombre
      </del>
    );
  }

  // Se devuelve un elemento <li> con el contenido del ítem (tachado o normal)
  return (
    <li className="item">
      {itemContent}
    </li>
  );
}

// Componente principal PackingList que será exportado por defecto
export default function PackingList() {
  return (
    <section>
      {/* Título de la lista de empaque */}
      <h1>Sally Ride's Packing List</h1>

      {/* Lista desordenada de elementos */}
      <ul>
        {/* Cada componente Item representa un objeto a empacar */}
        <Item 
          isPacked={true} 
          name="Space suit" 
        />
        <Item 
          isPacked={true} 
          name="Helmet with a golden leaf" 
        />
        <Item 
          isPacked={false} 
          name="Photo of Tam" 
        />
      </ul>
    </section>
  );
}