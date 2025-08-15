import { z } from "zod";

const ScrapedItemSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(500, "Title too long"),

  price: z
    .string()
    .min(1, "Price cannot be empty")
    .regex(/^\$\d+\.\d{2}$/, "Price must be in format $XX.XX"),
});

type ScrapedItem = z.infer<typeof ScrapedItemSchema>;

export { ScrapedItemSchema };
export type { ScrapedItem };
