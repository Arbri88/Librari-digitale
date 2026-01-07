import Joi from "joi";

export const loansReportSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    status: Joi.string().valid("active","returned","overdue").optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
  }).unknown(true),
  params: Joi.object().unknown(true),
});

export const booksReportSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    category: Joi.string().uuid().optional(),
  }).unknown(true),
  params: Joi.object().unknown(true),
});
