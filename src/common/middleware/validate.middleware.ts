import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as any;
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as any;
    }

    next();
  };
}
