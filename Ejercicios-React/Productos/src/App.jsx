import { useState } from 'react'; // Importa el hook useState desde React

// Componente principal que recibe productos como prop
function FilterableProductTable({ products }) {
  const [filterText, setFilterText] = useState(''); // Estado para el texto del filtro
  const [inStockOnly, setInStockOnly] = useState(false); // Estado para mostrar solo productos en stock

  return (
    <div>
      <SearchBar 
        filterText={filterText} // Pasa el texto del filtro al componente SearchBar
        inStockOnly={inStockOnly} // Pasa el valor del checkbox al componente SearchBar
        onFilterTextChange={setFilterText} // Pasa la función para actualizar el texto
        onInStockOnlyChange={setInStockOnly} // Pasa la función para actualizar el checkbox
      />
      <ProductTable 
        products={products} // Pasa los productos al componente ProductTable
        filterText={filterText} // Pasa el texto de filtro
        inStockOnly={inStockOnly} // Pasa el estado de solo en stock
      />
    </div>
  );
}

// Componente para mostrar el encabezado de cada categoría
function ProductCategoryRow({ category }) {
  return (
    <tr>
      <th colSpan="2"> {/* Encabezado que ocupa dos columnas */}
        {category} {/* Muestra el nombre de la categoría */}
      </th>
    </tr>
  );
}

// Componente para mostrar una fila de producto
function ProductRow({ product }) {
  const name = product.stocked ? product.name : // Si está en stock, muestra el nombre normal
    <span style={{ color: 'red' }}> {/* Si no, muestra el nombre en rojo */}
      {product.name}
    </span>;

  return (
    <tr>
      <td>{name}</td> {/* Nombre del producto */}
      <td>{product.price}</td> {/* Precio del producto */}
    </tr>
  );
}

// Componente que muestra la tabla de productos
function ProductTable({ products, filterText, inStockOnly }) {
  const rows = []; // Arreglo para almacenar las filas de la tabla
  let lastCategory = null; // Variable para llevar control de la categoría anterior

  products.forEach((product) => { // Recorre todos los productos
    if (product.name.toLowerCase().indexOf(filterText.toLowerCase()) === -1) {
      return; // Si el nombre no coincide con el filtro, no lo muestra
    }
    if (inStockOnly && !product.stocked) {
      return; // Si se seleccionó solo en stock y el producto no está en stock, lo salta
    }
    if (product.category !== lastCategory) { // Si cambia la categoría, agrega fila de categoría
      rows.push(
        <ProductCategoryRow
          category={product.category}
          key={product.category}
        />
      );
    }
    rows.push(
      <ProductRow
        product={product}
        key={product.name}
      />
    ); // Agrega la fila del producto
    lastCategory = product.category; // Actualiza la categoría anterior
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th> {/* Encabezado de columna Nombre */}
          <th>Price</th> {/* Encabezado de columna Precio */}
        </tr>
      </thead>
      <tbody>{rows}</tbody> {/* Muestra las filas generadas */}
    </table>
  );
}

// Componente que representa la barra de búsqueda y el filtro
function SearchBar({
  filterText,
  inStockOnly,
  onFilterTextChange,
  onInStockOnlyChange
}) {
  return (
    <form>
      <input 
        type="text"
        value={filterText} // Muestra el texto actual del filtro
        placeholder="Search..." // Texto sugerido en el campo
        onChange={(e) => onFilterTextChange(e.target.value)} // Cambia el texto del filtro al escribir
      />
      <label>
        <input 
          type="checkbox"
          checked={inStockOnly} // Estado actual del checkbox
          onChange={(e) => onInStockOnlyChange(e.target.checked)} // Cambia el estado del checkbox
        />
        {' '}
        Only show products in stock {/* Etiqueta del checkbox */}
      </label>
    </form>
  );
}

// Lista de productos que se usará en la tabla
const PRODUCTS = [
  {category: "Fruits", price: "$1", stocked: true, name: "Apple"},
  {category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit"},
  {category: "Fruits", price: "$2", stocked: false, name: "Passionfruit"},
  {category: "Vegetables", price: "$2", stocked: true, name: "Spinach"},
  {category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin"},
  {category: "Vegetables", price: "$1", stocked: true, name: "Peas"}
];

// Componente App que monta el componente principal con los productos
export default function App() {
  return <FilterableProductTable products={PRODUCTS} />;
}
