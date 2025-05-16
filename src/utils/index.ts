import { mensajePersonalizado } from "./mensajePesonalizado";
import { premios } from "./premios";

export const convertirCedula = (cedula: string) => {
  const partes = cedula.split("-");

  // Enmascarar las primeras partes
  const primerosDigitosEnmascarados = partes[0].replace(/./g, "*");
  const segundaParteEnmascarada = partes[1].replace(/.(?=.{3})/g, "*");

  // Unir las partes enmascaradas
  return [primerosDigitosEnmascarados, segundaParteEnmascarada, partes[2]].join(
    "-"
  );
};

// Función para obtener el lugar
export function getLugar(municipio) {
  const item = mensajePersonalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Lugar : "el lugar indicado";
}

// Función para obtener la fecha
export function getFecha(municipio) {
  const item = mensajePersonalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Fecha : "la fecha indicada";
}

// Función para obtener la hora
export function getHora(municipio) {
  const item = mensajePersonalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Hora : "la hora indicada";
}

export function getPremio(premio) {
  const item = premios.find(
    (item) => Object.keys(item)[0].toLowerCase() === premio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]] : {};
}
