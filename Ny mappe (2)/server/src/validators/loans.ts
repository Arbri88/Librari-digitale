import Joi from "joi";

export const listLoansSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    status: Joi.string().valid("active","returned","overdue").optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(true),
  params: Joi.object().unknown(true),
});

export const createLoanSchema = Joi.object({
  body: Joi.object({
    book_id: Joi.string().uuid().required(),
    notes: Joi.string().allow(null, ""),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const returnSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});
