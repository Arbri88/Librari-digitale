import Joi from "joi";

export const listUsersSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    q: Joi.string().max(200).optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(true),
  params: Joi.object().unknown(true),
});

export const updateUserSchema = Joi.object({
  body: Joi.object({
    full_name: Joi.string().max(100),
    role: Joi.string().valid("user","admin"),
    is_active: Joi.boolean(),
    phone: Joi.string().max(20).allow(null, ""),
    address: Joi.string().allow(null, ""),
  }).min(1).required(),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});

export const idParamSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});
