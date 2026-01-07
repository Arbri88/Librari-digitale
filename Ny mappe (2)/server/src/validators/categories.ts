import Joi from "joi";

export const createCategorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().allow(null, ""),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const updateCategorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().allow(null, ""),
  }).min(1).required(),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});

export const idParamSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});
