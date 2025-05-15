// import { join } from "path";
// import {
//   createBot,
//   createProvider,
//   createFlow,
//   addKeyword,
//   utils,
//   EVENTS,
// } from "@builderbot/bot";
// import { MongoAdapter as Database } from "@builderbot/database-mongo";
// import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
// import dotenv from "dotenv";
// import { MongoClient, Db } from "mongodb";
// import express, { Request, Response } from "express";
// import cors from "cors";
// import { Logger } from "./logger";
// import { authenticate } from "./middleware/auth";

// dotenv.config();
// declare global {
//   namespace NodeJS {
//     interface Global {
//       provider: any;
//     }
//   }
// }
// // Configuración y tipos
// type LogLevel = "debug" | "info" | "warn" | "error";
// const PORT = process.env.PORT ?? 3008;
// const API_KEY = process.env.API_KEY ?? "default_api_key";
// const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info") as LogLevel;
// const logger = new Logger(LOG_LEVEL);

// // Configuración de servicios y horarios
// const BUSINESS_HOURS = { start: 9, end: 18 };
// const AVAILABLE_SERVICES = {
//   "realizar presupuesto": { duration: 30, price: 20 },
//   "asesoría profesional": { duration: 60, price: 50 },
//   "soporte técnico": { duration: 45, price: 35 },
//   "consulta general": { duration: 15, price: 10 },
// };
// const APPOINTMENT_INTERVALS = 15;

// // Conexión a MongoDB
// let mongoClient: MongoClient | null = null;
// let db: Db | null = null;

// const initMongo = async (): Promise<Db | null> => {
//   try {
//     if (!mongoClient) {
//       const uri = process.env.MONGO_DB_URI;
//       if (!uri) throw new Error("MongoDB URI no configurada");
//       mongoClient = new MongoClient(uri);
//       await mongoClient.connect();
//       logger.info("✅ Conexión a MongoDB establecida");
//     }

//     const dbName = process.env.MONGO_DB_NAME;
//     if (!dbName) throw new Error("Nombre de BD no configurado");
//     db = mongoClient.db(dbName);
//     return db;
//   } catch (error) {
//     logger.error("❌ Error al conectar con MongoDB:", error);
//     return null;
//   }
// };

// // Utilidades
// const isValidFutureDate = (dateStr: string): boolean => {
//   const regex = /^\d{4}-\d{2}-\d{2}$/;
//   if (!regex.test(dateStr)) return false;
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) return false;
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
//   return date >= now;
// };

// const isValidService = (service: string): boolean => {
//   return Object.keys(AVAILABLE_SERVICES)
//     .map((s) => s.toLowerCase())
//     .includes(service.toLowerCase());
// };

// const getAvailableSlots = async (date: string): Promise<string[]> => {
//   if (!db) await initMongo();
//   if (!db) return [];

//   const appointments = await db
//     .collection("appointments")
//     .find({ date })
//     .toArray();
//   const slots: string[] = [];
//   const dateObj = new Date(date);
//   const dayOfWeek = dateObj.getDay();

//   if (dayOfWeek === 0) return []; // No domingos

//   const startHour = BUSINESS_HOURS.start;
//   const endHour = dayOfWeek === 6 ? 14 : BUSINESS_HOURS.end; // Horario reducido sábados

//   for (let hour = startHour; hour < endHour; hour++) {
//     for (let minute = 0; minute < 60; minute += APPOINTMENT_INTERVALS) {
//       const timeStr = `${hour.toString().padStart(2, "0")}:${minute
//         .toString()
//         .padStart(2, "0")}`;
//       if (!appointments.some((appt) => appt.time === timeStr)) {
//         slots.push(timeStr);
//       }
//     }
//   }

//   return slots;
// };

// // ==================== FLUJOS DEL BOT ====================

// const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME).addAction(
//   async (ctx, { flowDynamic, state }) => {
//     const welcomed = await state.get("welcomed");
//     if (!welcomed) {
//       await flowDynamic([
//         "👋 ¡Hola! Bienvenido a *Bot Services* By Madrigal.",
//         [
//           "Ofrecemos servicios profesionales como:",
//           "- 📊 Realizar presupuesto",
//           "- 🧑‍💼 Asesoría profesional",
//           "- 🛠️ Soporte técnico",
//           "- 💬 Consultas generales",
//           "",
//           "¿Deseas agendar una cita? Escribe *reservar* para comenzar.",
//           "O escribe *ayuda* para ver todas las opciones disponibles.",
//         ].join("\n"),
//       ]);
//       await state.update({ welcomed: true });
//     }
//   }
// );

// const bookingFlow = addKeyword<Provider, Database>([
//   "reservar",
//   "reserva",
//   "cita",
//   "agendar",
// ])
//   .addAnswer("Perfecto, vamos a agendar tu cita.")
//   .addAnswer(
//     "¿Cuál es tu nombre completo?",
//     { capture: true },
//     async (ctx, { state }) => {
//       await state.update({ name: ctx.body });
//     }
//   )
//   .addAnswer(
//     [
//       "¿Qué servicio deseas?",
//       "",
//       "Servicios disponibles:",
//       "1. Realizar un presupuesto (30 min - $20)",
//       "2. Asesoría profesional (60 min - $50)",
//       "3. Soporte técnico (45 min - $35)",
//       "4. Consulta general (15 min - $10)",
//     ].join("\n"),
//     { capture: true },
//     async (ctx, { state, fallBack }) => {
//       const service = ctx.body.toLowerCase();
//       let selectedService = service;

//       if (service === "1" || service === "1.")
//         selectedService = "realizar presupuesto";
//       else if (service === "2" || service === "2.")
//         selectedService = "asesoría profesional";
//       else if (service === "3" || service === "3.")
//         selectedService = "soporte técnico";
//       else if (service === "4" || service === "4.")
//         selectedService = "consulta general";

//       if (!isValidService(selectedService)) {
//         return fallBack(
//           "⚠️ Servicio no reconocido. Por favor, elige uno de los servicios listados."
//         );
//       }
//       await state.update({ service: selectedService });
//     }
//   )
//   .addAnswer(
//     "¿Para qué fecha te gustaría agendarlo? (formato: YYYY-MM-DD)",
//     { capture: true },
//     async (ctx, { state, fallBack }) => {
//       if (!isValidFutureDate(ctx.body)) {
//         return fallBack(
//           "⚠️ Fecha inválida. Usa el formato YYYY-MM-DD y asegúrate que sea futura."
//         );
//       }
//       await state.update({ date: ctx.body });
//     }
//   )
//   .addAction(async (ctx, { state, flowDynamic }) => {
//     const date = await state.get("date");
//     const availableSlots = await getAvailableSlots(date);

//     if (availableSlots.length === 0) {
//       await flowDynamic([
//         "⚠️ Lo siento, no hay horarios disponibles para esa fecha.",
//         "Por favor, elige otra fecha (formato: YYYY-MM-DD):",
//       ]);
//       return;
//     }

//     const slotsToShow = availableSlots.slice(0, 8);
//     const slotsMessage = slotsToShow
//       .map((slot, index) => `${index + 1}. ${slot}`)
//       .join("\n");

//     await flowDynamic([
//       "🕒 Horarios disponibles:",
//       slotsMessage,
//       "",
//       "Responde con el número de tu preferencia:",
//     ]);

//     await state.update({ availableSlots: slotsToShow });
//   })
//   .addAction({ capture: true }, async (ctx, { state, fallBack }) => {
//     const slots = await state.get("availableSlots");
//     const selectedIndex = parseInt(ctx.body, 10) - 1;

//     if (
//       isNaN(selectedIndex) ||
//       selectedIndex < 0 ||
//       selectedIndex >= slots.length
//     ) {
//       return fallBack(
//         "⚠️ Selección inválida. Por favor, elige un número de la lista."
//       );
//     }

//     await state.update({ time: slots[selectedIndex] });
//     await flowDynamic(["Por favor, proporciona tu email para confirmaciones:"]);
//   })
//   .addAction({ capture: true }, async (ctx, { state }) => {
//     await state.update({ email: ctx.body });
//   })
//   .addAction(async (ctx, { state, flowDynamic }) => {
//     const { name, service, date, time, email } = await state.getAll();
//     const phone = ctx.from;
//     const serviceInfo =
//       AVAILABLE_SERVICES[
//         service.toLowerCase() as keyof typeof AVAILABLE_SERVICES
//       ];

//     try {
//       if (!db) await initMongo();
//       if (!db) throw new Error("No se pudo conectar a la base de datos");

//       // Verificar disponibilidad
//       const existingAppointment = await db
//         .collection("appointments")
//         .findOne({ date, time });
//       if (existingAppointment) {
//         await flowDynamic([
//           "⚠️ Lo sentimos, ese horario acaba de ser reservado por alguien más.",
//           "Por favor, inicia el proceso nuevamente con 'reservar'.",
//         ]);
//         return;
//       }

//       const appointmentId = Math.random()
//         .toString(36)
//         .substring(2, 10)
//         .toUpperCase();

//       await db.collection("appointments").insertOne({
//         appointmentId,
//         phone,
//         name,
//         email,
//         service,
//         serviceDetails: serviceInfo,
//         date,
//         time,
//         status: "confirmed",
//         createdAt: new Date(),
//       });

//       await flowDynamic([
//         `✅ ¡Gracias, ${name}!`,
//         `Tu cita para *${service}* ha sido agendada para el *${date}* a las *${time}*.`,
//         `📝 ID de tu cita: *${appointmentId}*`,
//         `⏱️ Duración: ${serviceInfo.duration} minutos`,
//         `💰 Precio: $${serviceInfo.price}`,
//         `📧 Hemos enviado confirmación a: ${email}`,
//         "",
//         "Para cancelar, responde con 'cancelar ${appointmentId}'.",
//       ]);

//       logger.info(`📅 Cita agendada: ${appointmentId}`);
//     } catch (error) {
//       logger.error("Error al guardar la cita:", error);
//       await flowDynamic([
//         "⚠️ Lo sentimos, hubo un problema al guardar tu cita.",
//         "Por favor, intenta nuevamente o contáctanos directamente.",
//       ]);
//     }
//   });

// const cancelFlow = addKeyword<Provider, Database>(["cancelar"]).addAction(
//   async (ctx, { flowDynamic }) => {
//     try {
//       const match = ctx.body.match(/cancelar\s+([A-Z0-9]{8})/i);
//       if (!match?.[1]) {
//         return await flowDynamic([
//           "⚠️ Formato incorrecto. Usa: cancelar ABC12345",
//         ]);
//       }

//       if (!db) await initMongo();
//       if (!db) throw new Error("No se pudo conectar a la base de datos");

//       const result = await db
//         .collection("appointments")
//         .findOneAndUpdate(
//           { appointmentId: match[1], phone: ctx.from },
//           { $set: { status: "cancelled", cancelledAt: new Date() } }
//         );

//       if (!result.value) {
//         return await flowDynamic([
//           `⚠️ No se encontró la cita con ID ${match[1]}`,
//         ]);
//       }

//       await flowDynamic([
//         `✅ Cita ${match[1]} cancelada correctamente.`,
//         `Tu cita para ${result.value.service} el ${result.value.date} ha sido cancelada.`,
//       ]);
//     } catch (error) {
//       logger.error("Error al cancelar cita:", error);
//       await flowDynamic([
//         "⚠️ Lo sentimos, hubo un problema al cancelar tu cita.",
//         "Por favor, intenta nuevamente.",
//       ]);
//     }
//   }
// );

// const checkAppointmentsFlow = addKeyword<Provider, Database>([
//   "mis citas",
//   "consultar citas",
// ]).addAction(async (ctx, { flowDynamic }) => {
//   try {
//     if (!db) await initMongo();
//     if (!db) throw new Error("No se pudo conectar a la base de datos");

//     const appointments = await db
//       .collection("appointments")
//       .find({ phone: ctx.from, status: "confirmed" })
//       .sort({ date: 1, time: 1 })
//       .toArray();

//     if (appointments.length === 0) {
//       return await flowDynamic([
//         "No tienes citas programadas actualmente.",
//         "Para agendar una cita, escribe 'reservar'.",
//       ]);
//     }

//     const message = ["📅 Tus citas programadas:", ""];
//     appointments.forEach((appt, index) => {
//       message.push(`*${index + 1}. ID: ${appt.appointmentId}*`);
//       message.push(`📝 Servicio: ${appt.service}`);
//       message.push(`📆 Fecha: ${appt.date} - ⏰ Hora: ${appt.time}`);
//       message.push(`💰 Precio: $${appt.serviceDetails?.price || "N/A"}`);
//       message.push("");
//     });

//     message.push("Para cancelar una cita, escribe 'cancelar ID'.");

//     await flowDynamic([message.join("\n")]);
//   } catch (error) {
//     logger.error("Error al consultar citas:", error);
//     await flowDynamic([
//       "⚠️ Lo sentimos, hubo un problema al consultar tus citas.",
//       "Por favor, intenta nuevamente más tarde.",
//     ]);
//   }
// });

// const helpFlow = addKeyword<Provider, Database>(["ayuda", "help"]).addAnswer([
//   "📋 *Comandos disponibles:*",
//   "",
//   "• *reservar* - Agendar una nueva cita",
//   "• *mis citas* - Ver tus citas programadas",
//   "• *cancelar ID* - Cancelar una cita específica",
//   "• *horarios* - Ver horarios disponibles",
//   "• *servicios* - Ver lista de servicios",
//   "• *contacto* - Información de contacto",
//   "• *ayuda* - Mostrar este menú",
//   "",
//   "¿En qué te puedo ayudar hoy?",
// ]);

// const servicesFlow = addKeyword<Provider, Database>([
//   "servicios",
//   "precios",
// ]).addAnswer([
//   "🛎️ *Nuestros servicios y precios:*",
//   "",
//   "1. *Realizar presupuesto*",
//   "   ⏱️ Duración: 30 minutos",
//   "   💰 Precio: $20",
//   "",
//   "2. *Asesoría profesional*",
//   "   ⏱️ Duración: 60 minutos",
//   "   💰 Precio: $50",
//   "",
//   "3. *Soporte técnico*",
//   "   ⏱️ Duración: 45 minutos",
//   "   💰 Precio: $35",
//   "",
//   "4. *Consulta general*",
//   "   ⏱️ Duración: 15 minutos",
//   "   💰 Precio: $10",
//   "",
//   "Para agendar, escribe 'reservar'.",
// ]);

// const scheduleFlow = addKeyword<Provider, Database>([
//   "horarios",
//   "disponibilidad",
// ]).addAnswer(
//   "¿Para qué fecha deseas consultar disponibilidad? (YYYY-MM-DD)",
//   { capture: true },
//   async (ctx, { flowDynamic, fallBack }) => {
//     const date = ctx.body;
//     if (!isValidFutureDate(date)) {
//       return fallBack(
//         "⚠️ Fecha inválida. Usa el formato YYYY-MM-DD y asegúrate que sea futura."
//       );
//     }

//     const availableSlots = await getAvailableSlots(date);
//     if (availableSlots.length === 0) {
//       return await flowDynamic([
//         `⚠️ No hay horarios disponibles para el ${date}.`,
//         "Por favor, consulta otra fecha.",
//       ]);
//     }

//     const hourGroups: Record<string, string[]> = {};
//     availableSlots.forEach((slot) => {
//       const hour = slot.split(":")[0];
//       hourGroups[hour] = hourGroups[hour] || [];
//       hourGroups[hour].push(slot.split(":")[1]);
//     });

//     const message = [`🕒 *Horarios disponibles para el ${date}:*`, ""];
//     Object.entries(hourGroups).forEach(([hour, minutes]) => {
//       message.push(
//         `*${hour}:00* → ${minutes.map((m) => `${hour}:${m}`).join(", ")}`
//       );
//     });

//     message.push("", "Para agendar, escribe 'reservar'.");
//     await flowDynamic([message.join("\n")]);
//   }
// );

// const contactFlow = addKeyword<Provider, Database>([
//   "contacto",
//   "hablar con humano",
// ]).addAnswer([
//   "📞 *Información de contacto:*",
//   "",
//   "Si necesitas hablar con un representante:",
//   "",
//   "☎️ Teléfono: +1 (829) 230-3288",
//   "📧 Email: contacto@jmmultimediard.com",
//   "🌐 Web: www.jmmultimediard.com",
//   "⏰ Horario: Lunes a Viernes 9AM - 6PM",
//   "",
//   "Un representante te contactará en breve.",
// ]);

// const mediaFlow = addKeyword<Provider, Database>(EVENTS.MEDIA).addAction(
//   async (_, { flowDynamic }) => {
//     await flowDynamic([
//       "¡Gracias por compartir! 😊",
//       "¿En qué puedo ayudarte hoy? Escribe *ayuda* para ver opciones.",
//     ]);
//   }
// );

// const thanksFlow = addKeyword<Provider, Database>([
//   "gracias",
//   "thanks",
// ]).addAnswer([
//   "¡De nada! 😊 Estamos para servirte.",
//   "¿Hay algo más en lo que pueda ayudarte hoy?",
// ]);

// // ==================== INICIALIZACIÓN ====================

// const main = async () => {
//   const adapterFlow = createFlow([
//     welcomeFlow,
//     mediaFlow,
//     bookingFlow,
//     cancelFlow,
//     checkAppointmentsFlow,
//     helpFlow,
//     servicesFlow,
//     scheduleFlow,
//     contactFlow,
//     thanksFlow,
//   ]);

//   const adapterProvider = createProvider(Provider);
//   const adapterDB = new Database({
//     dbUri: process.env.MONGO_DB_URI!,
//     dbName: process.env.MONGO_DB_NAME!,
//   });

//   // Configuración de Express
//   const app = express();
//   app.use(cors());
//   app.use(express.json());
//   app.use("/v1", authenticate(API_KEY));

//   // Crear el bot
//   const { httpServer, provider } = await createBot({
//     flow: adapterFlow,
//     provider: adapterProvider,
//     database: adapterDB,
//   });

//   // Almacenar provider globalmente
//   globalThis.provider = provider;

//   await initMongo();

//   // ==================== ENDPOINTS API ====================

//   // Endpoint para agendar citas
//   app.post("/v1/booking", async (req: Request, res: Response) => {
//     try {
//       const { number, name, service, date, time, email } = req.body;

//       // Validaciones básicas
//       if (!number || !name || !service || !date) {
//         return res.status(400).json({ error: "Faltan campos obligatorios" });
//       }

//       if (!isValidFutureDate(date)) {
//         return res.status(400).json({ error: "Fecha inválida o pasada" });
//       }

//       if (!isValidService(service)) {
//         return res.status(400).json({ error: "Servicio no disponible" });
//       }

//       // Si se proporcionan todos los datos, crear cita directamente
//       if (time && email) {
//         if (!db) await initMongo();
//         if (!db) {
//           return res
//             .status(500)
//             .json({ error: "Error de conexión a la base de datos" });
//         }

//         const serviceInfo =
//           AVAILABLE_SERVICES[
//             service.toLowerCase() as keyof typeof AVAILABLE_SERVICES
//           ];
//         const appointmentId = Math.random()
//           .toString(36)
//           .substring(2, 10)
//           .toUpperCase();

//         await db.collection("appointments").insertOne({
//           appointmentId,
//           phone: number,
//           name,
//           email,
//           service,
//           serviceDetails: serviceInfo,
//           date,
//           time,
//           status: "confirmed",
//           createdAt: new Date(),
//         });

//         // Enviar confirmación por WhatsApp
//         await globalThis.provider.sendMessage(number, {
//           text: [
//             `✅ ¡Hola, ${name}!`,
//             `Tu cita para *${service}* ha sido agendada para el *${date}* a las *${time}*.`,
//             `📝 ID de tu cita: *${appointmentId}*`,
//             `⏱️ Duración: ${serviceInfo.duration} minutos`,
//             `💰 Precio: $${serviceInfo.price}`,
//             "",
//             "Para cancelar, responde con 'cancelar ${appointmentId}'.",
//           ].join("\n"),
//         });

//         return res.status(201).json({
//           success: true,
//           appointmentId,
//           message: "Cita creada exitosamente",
//         });
//       }

//       // Si faltan datos, iniciar flujo conversacional
//       await globalThis.provider.sendMessage(number, {
//         text: `Hola ${name}, vamos a agendar tu cita. Por favor sigue las instrucciones.`,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Flujo de reserva iniciado",
//       });
//     } catch (error) {
//       logger.error("Error en endpoint /v1/booking:", error);
//       return res.status(500).json({ error: "Error interno del servidor" });
//     }
//   });

//   // Endpoint para consultar citas
//   app.get("/v1/appointments", async (req: Request, res: Response) => {
//     try {
//       if (!db) await initMongo();
//       if (!db) {
//         return res
//           .status(500)
//           .json({ error: "Error de conexión a la base de datos" });
//       }

//       const { phone, date, status } = req.query;
//       const query: Record<string, any> = {};
//       if (phone) query.phone = phone.toString();
//       if (date) query.date = date.toString();
//       if (status) query.status = status.toString();

//       const appointments = await db
//         .collection("appointments")
//         .find(query)
//         .sort({ date: 1, time: 1 })
//         .toArray();

//       return res.status(200).json({
//         success: true,
//         count: appointments.length,
//         appointments: appointments.map((appt) => ({
//           id: appt.appointmentId,
//           name: appt.name,
//           phone: appt.phone,
//           email: appt.email,
//           service: appt.service,
//           date: appt.date,
//           time: appt.time,
//           status: appt.status,
//           duration: appt.serviceDetails?.duration,
//           price: appt.serviceDetails?.price,
//           createdAt: appt.createdAt,
//         })),
//       });
//     } catch (error) {
//       logger.error("Error en endpoint /v1/appointments:", error);
//       return res.status(500).json({ error: "Error interno del servidor" });
//     }
//   });

//   // Endpoint para ver disponibilidad
//   app.get("/v1/availability", async (req: Request, res: Response) => {
//     try {
//       const date = req.query.date?.toString();
//       if (!date || !isValidFutureDate(date)) {
//         return res
//           .status(400)
//           .json({ error: "Fecha inválida (formato: YYYY-MM-DD)" });
//       }

//       const availableSlots = await getAvailableSlots(date);
//       return res.status(200).json({
//         success: true,
//         date,
//         availableSlots,
//         count: availableSlots.length,
//       });
//     } catch (error) {
//       logger.error("Error en endpoint /v1/availability:", error);
//       return res.status(500).json({ error: "Error interno del servidor" });
//     }
//   });

//   // Endpoint para cancelar citas
//   app.delete("/v1/appointments/:id", async (req: Request, res: Response) => {
//     try {
//       const { id: appointmentId } = req.params;
//       const phone = req.query.phone?.toString();

//       if (!appointmentId || !phone) {
//         return res
//           .status(400)
//           .json({ error: "Se requiere ID y número de teléfono" });
//       }

//       if (!db) await initMongo();
//       if (!db) {
//         return res
//           .status(500)
//           .json({ error: "Error de conexión a la base de datos" });
//       }

//       const result = await db
//         .collection("appointments")
//         .findOneAndUpdate(
//           { appointmentId, phone },
//           { $set: { status: "cancelled", cancelledAt: new Date() } }
//         );

//       if (!result.value) {
//         return res.status(404).json({ error: "Cita no encontrada" });
//       }

//       // Enviar notificación por WhatsApp
//       await globalThis.provider.sendMessage(phone, {
//         text: `✅ Tu cita ${appointmentId} ha sido cancelada correctamente.`,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Cita cancelada exitosamente",
//       });
//     } catch (error) {
//       logger.error("Error en endpoint DELETE /v1/appointments/:id:", error);
//       return res.status(500).json({ error: "Error interno del servidor" });
//     }
//   });

//   // Iniciar servidor
//   httpServer.listen(PORT, () => {
//     logger.info(`✅ Servidor escuchando en puerto ${PORT}`);
//     logger.info(`📅 Sistema de citas operativo`);
//     logger.info(`📞 WhatsApp Business conectado`);
//     logger.info(`🗄️  MongoDB conectado`);
//     logger.info(`🔌 API REST disponible en /v1`);
//   });

//   // Manejo de cierre limpio
//   process.on("SIGTERM", () => {
//     httpServer.close(() => {
//       logger.info("🛑 Servidor cerrado");
//       process.exit(0);
//     });
//   });
// };

// // Declaración global para TypeScript
// declare global {
//   const provider: any;
// }

// // Manejo de errores no capturados
// process.on("unhandledRejection", (error) => {
//   logger.error("Unhandled Rejection:", error);
// });

// process.on("uncaughtException", (error) => {
//   logger.error("Uncaught Exception:", error);
// });

// // Ejecutar la aplicación
// main().catch((error) => {
//   logger.error("Error al iniciar el bot:", error);
//   process.exit(1);
// });
