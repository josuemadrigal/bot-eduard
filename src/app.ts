import { join } from "path";
import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  utils,
  EVENTS,
} from "@builderbot/bot";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { convertirCedula, getFecha, getHora, getLugar } from "./utils";
import cors from "cors";
dotenv.config();

const PORT = process.env.PORT ?? 3008;

// Conexión global a MongoDB para operaciones directas
let mongoClient: MongoClient | null = null;

const initMongo = async () => {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(process.env.MONGO_DB_URI!);
      await mongoClient.connect();
      console.log("✅ Conexión directa a MongoDB establecida");
    }
    return mongoClient.db(process.env.MONGO_DB_NAME);
  } catch (error) {
    console.error("❌ Error al conectar directamente con MongoDB:", error);
    return null;
  }
};

// === Inicialización del bot ===
const main = async () => {
  const adapterFlow = createFlow([]);

  const adapterProvider = createProvider(Provider);
  const adapterDB = new Database({
    dbUri: process.env.MONGO_DB_URI!,
    dbName: process.env.MONGO_DB_NAME!,
  });

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  adapterProvider.server.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Manejo de preflight requests para CORS
  adapterProvider.server.options("*", cors());
  // Inicializar la conexión a MongoDB
  await initMongo();

  // === POST para enviar mensajes
  adapterProvider.server.post(
    "/v1/messagesSorteo",
    handleCtx(async (bot, req, res) => {
      const { phone, name, cedula, municipio, urlMedia } = req.body;
      const nombre = name.split(" ")[0].toUpperCase();
      const nombreFormateado =
        nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();

      let municipioTitle;

      switch (municipio) {
        case "caleta":
          municipioTitle = "Caleta";
          break;
        case "cumayasa":
          municipioTitle = "Cumayasa";
          break;
        case "guaymate":
          municipioTitle = "Guaymate";
          break;
        case "villa-hermosa":
          municipioTitle = "Villa Hermosa";
          break;
        case "la-romana":
          municipioTitle = "La Romana";
          break;
        default:
          municipioTitle = "Municipio no válido";
          break;
      }

      await bot.sendMessage(
        phone,
        `👋🏼 Hola *${nombreFormateado}*, gracias por registrarte. 
        \nTe has registrado exitosamente para el sorteo de *${municipioTitle}*, que se llevará a cabo 📍 en *${getLugar(
          municipio
        )}*, 🗓️ el *${getFecha(municipio)}* a las *${getHora(municipio)}*. 
        \nRecuerda que debes *llevar tu cédula* (${convertirCedula(
          cedula
        )}) al evento para participar. 
        \n*¡Te esperamos! ☘️*
        `,
        { media: urlMedia ?? null }
      );

      try {
        // Usamos la conexión directa a MongoDB en lugar del adaptador
        const db = await initMongo();
        if (!db) {
          throw new Error("No se pudo conectar a la base de datos");
        }

        const collection = db.collection("RegistradosMadres");
        await collection.insertOne({
          phone,
          name,
          cedula,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("Error al guardar registro:", error);
      }
      return res.end("sent");
    })
  );

  httpServer(+PORT);
  console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
};

main().catch((error) => {
  console.error("❌ Error fatal en la aplicación:", error);
  process.exit(1);
});
