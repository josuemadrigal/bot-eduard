import { Request, Response, NextFunction } from "express";

/**
 * Middleware para autenticar solicitudes API usando un API key
 */
export const authenticate = (apiKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar el API key en el header o como parámetro de consulta
    const providedKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!providedKey || providedKey !== apiKey) {
      return res.status(401).json({
        error: "Acceso no autorizado. API key inválida o no proporcionada.",
      });
    }

    next();
  };
};
