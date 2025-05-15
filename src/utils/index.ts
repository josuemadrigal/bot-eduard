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

const personalizado = [
  {
    caleta: {
      Fecha: "Jueves 22 de Mayo",
      Hora: "4:00 pm",
      Lugar: "la Cancha de Caleta",
    },
  },
  {
    cumayasa: {
      Fecha: "Jueves 22 de Mayo",
      Hora: "2:00 pm",
      Lugar: "la Cancha de Cumayasa",
    },
  },
  {
    guaymate: {
      Fecha: "Viernes 23 de Mayo",
      Hora: "5:00 pm",
      Lugar: "la Emilio Prud Homme, frente al parque",
    },
  },
  {
    "villa-hermosa": {
      Fecha: "Sábado 24 de Mayo",
      Hora: "2:00 pm",
      Lugar: "el Politécnico Luis Heriberto Payán",
    },
  },
  {
    "la-romana": {
      Fecha: "Sábado 24 de Mayo",
      Hora: "4:00 pm",
      Lugar: "el Polideportivo Eleoncio Mercedes",
    },
  },
];

// Función para obtener el lugar
export function getLugar(municipio) {
  const item = personalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Lugar : "el lugar indicado";
}

// Función para obtener la fecha
export function getFecha(municipio) {
  const item = personalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Fecha : "la fecha indicada";
}

// Función para obtener la hora
export function getHora(municipio) {
  const item = personalizado.find(
    (item) => Object.keys(item)[0].toLowerCase() === municipio.toLowerCase()
  );
  return item ? item[Object.keys(item)[0]].Hora : "la hora indicada";
}
