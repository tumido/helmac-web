-- Convert existing text content to JSON block arrays before changing column type

-- InfoSections: wrap markdown text in a richtext block array with layout
UPDATE "info_sections"
SET "content" = jsonb_build_array(
    jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'richtext',
        'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 4),
        'content', "content"
    )
)::text
WHERE "content" IS NOT NULL AND "content" != '';

-- Offers: wrap markdown text in a richtext block array with layout
UPDATE "offers"
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
UPDATE "info_sections" SET "content" = '[]' WHERE "content" IS NULL OR "content" = '';
UPDATE "offers" SET "content" = '[]' WHERE "content" IS NULL OR "content" = '';

-- Now safely change column type from text to jsonb
ALTER TABLE "info_sections" ALTER COLUMN "content" TYPE JSONB USING "content"::jsonb;
ALTER TABLE "info_sections" ALTER COLUMN "content" SET DEFAULT '[]';
ALTER TABLE "info_sections" ALTER COLUMN "content" SET NOT NULL;

ALTER TABLE "offers" ALTER COLUMN "content" TYPE JSONB USING "content"::jsonb;
ALTER TABLE "offers" ALTER COLUMN "content" SET DEFAULT '[]';
ALTER TABLE "offers" ALTER COLUMN "content" SET NOT NULL;
