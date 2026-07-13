-- Replace the single (person_id, field_id) unique constraint with two
-- partial unique indexes so priced fields can have one row per option.

ALTER TABLE "v2_order_line_items"
    DROP CONSTRAINT IF EXISTS "v2_order_line_items_person_id_field_id_key";

-- Non-priced fields: one row per (person, field)
CREATE UNIQUE INDEX uq_v2_oli_person_field
    ON "v2_order_line_items" (person_id, field_id)
    WHERE pricing_option_id IS NULL;

-- Priced fields: one row per (person, field, option)
CREATE UNIQUE INDEX uq_v2_oli_person_field_option
    ON "v2_order_line_items" (person_id, field_id, pricing_option_id)
    WHERE pricing_option_id IS NOT NULL;
