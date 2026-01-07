import type { Request, Response, NextFunction } from "express";
import type Joi from "joi";
import { HttpError } from "../lib/error.js";

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(
      { body: (req.body ?? {}), query: (req.query ?? {}), params: (req.params ?? {}) },
      { abortEarly: false, stripUnknown: true }
    );
    if (error) return next(new HttpError(400, "Të dhëna të pavlefshme.", error.details));
    req.body = value.body;
    req.query = value.query;
    req.params = value.params;
    next();
  };
}
