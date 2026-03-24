import { z } from 'zod';

// Generic paginated response wrapper
export const PaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int(),
      page: z.number().int(),
      perPage: z.number().int(),
      totalPages: z.number().int(),
    }),
  });

// Generic API error response
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Success wrapper
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  });
