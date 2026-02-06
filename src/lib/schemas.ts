import { z } from 'zod';

export const ServiceSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    description: z.string().optional(),
    value: z.number().min(0, 'O valor não pode ser negativo'),
    serviceCode: z.string().optional(),
    active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof ServiceSchema>;
