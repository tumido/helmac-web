-- Add subtitle column to rules
ALTER TABLE "rules" ADD COLUMN "subtitle" TEXT;

-- Convert existing text content to JSON block arrays before changing column type
UPDATE "rules"
SET "content" = jsonb_build_array(
    jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'richtext',
        'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 4),
        'content', "content"
    )
)::text
WHERE "content" IS NOT NULL AND "content" != '';

-- Set empty rows to empty array
UPDATE "rules" SET "content" = '[]' WHERE "content" IS NULL OR "content" = '';

-- Change column type from text to jsonb
ALTER TABLE "rules" ALTER COLUMN "content" TYPE JSONB USING "content"::jsonb;
ALTER TABLE "rules" ALTER COLUMN "content" SET DEFAULT '[]';
ALTER TABLE "rules" ALTER COLUMN "content" SET NOT NULL;
