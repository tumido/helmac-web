-- ============================================================================
-- Phase 1 (#84): v2 normalized registration schema
-- Shopping-cart / stock-keeping model. Creates 13 v2_ tables, 4 views,
-- 9 functions and 1 capacity-enforcement trigger. The only change to an
-- existing table is adding bank_transactions.order_id.
-- No behavioral changes yet -- tables are created empty.
-- ============================================================================

-- ============================================================================
-- TABLES + INDEXES
-- ============================================================================

-- ---- Catalog -----------------------------------------------------------------

-- 1. Price tiers (form-level deadlines, shared across all items)
CREATE TABLE "v2_price_tiers" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    form_id     TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    year_id     TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    deadline    TIMESTAMPTZ,  -- NULL = fallback tier (after all deadlines)
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, sort_order)
);

-- 2. Pricing definitions (product categories)
CREATE TABLE "v2_pricing_definitions" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legacy_id       TEXT,
    form_id         TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    year_id         TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'options',
    multi_select    BOOLEAN NOT NULL DEFAULT false,
    unit_name       TEXT,
    use_price_tiers BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_v2_pricing_def_legacy ON "v2_pricing_definitions"(legacy_id) WHERE legacy_id IS NOT NULL;

-- 3. Pricing options (SKUs)
CREATE TABLE "v2_pricing_options" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legacy_id       TEXT,
    definition_id   TEXT NOT NULL REFERENCES "v2_pricing_definitions"(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_v2_pricing_opt_legacy ON "v2_pricing_options"(legacy_id) WHERE legacy_id IS NOT NULL;

-- 4. Pricing option prices (price per SKU per tier -- proper FK)
CREATE TABLE "v2_pricing_option_prices" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    option_id   TEXT NOT NULL REFERENCES "v2_pricing_options"(id) ON DELETE CASCADE,
    tier_id     TEXT NOT NULL REFERENCES "v2_price_tiers"(id) ON DELETE CASCADE,
    price       INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(option_id, tier_id)
);

-- 5. Form fields (input fields only -- layout stays in JSON)
CREATE TABLE "v2_form_fields" (
    id                              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legacy_id                       TEXT,
    form_id                         TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    year_id                         TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    name                            TEXT NOT NULL,
    label                           TEXT NOT NULL,
    type                            TEXT NOT NULL,
    required                        BOOLEAN NOT NULL DEFAULT false,
    editable                        BOOLEAN NOT NULL DEFAULT false,
    pricing_definition_id           TEXT REFERENCES "v2_pricing_definitions"(id) ON DELETE SET NULL,
    include_for_additional_people   BOOLEAN NOT NULL DEFAULT false,
    options                         TEXT[],
    is_active                       BOOLEAN NOT NULL DEFAULT true,
    sort_order                      INT NOT NULL DEFAULT 0,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, name)
);
CREATE UNIQUE INDEX idx_v2_form_fields_legacy ON "v2_form_fields"(legacy_id) WHERE legacy_id IS NOT NULL;

-- 6. Form conditions (unified: form visibility + email triggers + email sections)
CREATE TABLE "v2_form_conditions" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legacy_id   TEXT,
    form_id     TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    year_id     TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_v2_form_cond_legacy ON "v2_form_conditions"(legacy_id) WHERE legacy_id IS NOT NULL;

-- 7. Condition rules
CREATE TABLE "v2_form_condition_rules" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    condition_id    TEXT NOT NULL REFERENCES "v2_form_conditions"(id) ON DELETE CASCADE,
    field_id        TEXT REFERENCES "v2_form_fields"(id) ON DELETE CASCADE,
    operator        TEXT NOT NULL,
    value           TEXT,
    connector       TEXT NOT NULL DEFAULT 'AND',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Capacity limits (stock levels)
CREATE TABLE "v2_capacity_limits" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legacy_id       TEXT,
    form_id         TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    year_id         TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    field_id        TEXT NOT NULL REFERENCES "v2_form_fields"(id) ON DELETE CASCADE,
    option_value    TEXT NOT NULL,
    max_count       INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, field_id, option_value)
);
CREATE UNIQUE INDEX idx_v2_cap_limit_legacy ON "v2_capacity_limits"(legacy_id) WHERE legacy_id IS NOT NULL;

-- ---- Orders ------------------------------------------------------------------

-- 9. Orders (standalone -- replaces registration_submissions)
CREATE TABLE "v2_orders" (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    year_id                 TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    form_id                 TEXT NOT NULL REFERENCES "registration_forms"(id) ON DELETE CASCADE,
    public_user_id          TEXT REFERENCES "public_users"(id) ON DELETE SET NULL,
    order_type              TEXT NOT NULL DEFAULT 'registration',
    parent_order_id         TEXT REFERENCES "v2_orders"(id) ON DELETE CASCADE,
    status                  TEXT NOT NULL DEFAULT 'PENDING',
    is_paid                 BOOLEAN NOT NULL DEFAULT false,
    paid_at                 TIMESTAMPTZ,
    total_price             INT,
    variable_symbol         TEXT UNIQUE,
    email_sent              BOOLEAN NOT NULL DEFAULT false,
    email_sent_at           TIMESTAMPTZ,
    admin_note              TEXT,
    gdpr_consent_at         TIMESTAMPTZ,
    is_test                 BOOLEAN NOT NULL DEFAULT false,
    legacy_submission_id    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_v2_orders_year ON "v2_orders"(year_id);
CREATE INDEX idx_v2_orders_parent ON "v2_orders"(parent_order_id);
CREATE INDEX idx_v2_orders_vs ON "v2_orders"(variable_symbol);
CREATE INDEX idx_v2_orders_legacy ON "v2_orders"(legacy_submission_id) WHERE legacy_submission_id IS NOT NULL;

-- 10. Order people
CREATE TABLE "v2_order_people" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id        TEXT NOT NULL REFERENCES "v2_orders"(id) ON DELETE CASCADE,
    person_index    INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(order_id, person_index)
);

-- 11. Order line items (unified: every field value is a row)
CREATE TABLE "v2_order_line_items" (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    person_id                   TEXT NOT NULL REFERENCES "v2_order_people"(id) ON DELETE CASCADE,
    order_id                    TEXT NOT NULL REFERENCES "v2_orders"(id) ON DELETE CASCADE,
    year_id                     TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    field_id                    TEXT NOT NULL REFERENCES "v2_form_fields"(id) ON DELETE CASCADE,
    pricing_option_id           TEXT REFERENCES "v2_pricing_options"(id),
    value                       TEXT,
    quantity                    INT NOT NULL DEFAULT 1,
    unit_price_at_submission    INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(person_id, field_id)
);
CREATE INDEX idx_v2_oli_year_field_value ON "v2_order_line_items"(year_id, field_id, value);
CREATE INDEX idx_v2_oli_order ON "v2_order_line_items"(order_id);

-- ---- Emails ------------------------------------------------------------------

-- 12. Email templates (replaces Year email columns + conditional_emails)
CREATE TABLE "v2_email_templates" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    year_id         TEXT NOT NULL REFERENCES "years"(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    condition_id    TEXT REFERENCES "v2_form_conditions"(id) ON DELETE SET NULL,
    name            TEXT NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT false,
    subject         TEXT,
    body            TEXT,
    bcc             TEXT,
    account_id      TEXT REFERENCES "email_accounts"(id) ON DELETE SET NULL,
    attachments     JSONB NOT NULL DEFAULT '[]',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Email sections (conditional content blocks within templates)
CREATE TABLE "v2_email_sections" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_id     TEXT NOT NULL REFERENCES "v2_email_templates"(id) ON DELETE CASCADE,
    condition_id    TEXT REFERENCES "v2_form_conditions"(id) ON DELETE SET NULL,
    body            TEXT NOT NULL DEFAULT '',
    attachments     JSONB NOT NULL DEFAULT '[]',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- ALTER existing table (only allowed exception) ---------------------------

ALTER TABLE "bank_transactions"
    ADD COLUMN order_id TEXT REFERENCES "v2_orders"(id) ON DELETE SET NULL;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW v2_order_status_summary AS
SELECT year_id,
    COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED','REJECTED') AND is_test = false) AS registrations,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED' AND is_test = false) AS confirmed,
    COUNT(*) FILTER (WHERE status = 'PENDING' AND is_test = false) AS pending,
    COUNT(*) FILTER (WHERE status = 'WAITLIST' AND is_test = false) AS waitlist,
    COALESCE(SUM(total_price) FILTER (WHERE is_paid AND status NOT IN ('CANCELLED','REJECTED') AND is_test = false), 0) AS paid_total,
    COALESCE(SUM(total_price) FILTER (WHERE NOT is_paid AND status NOT IN ('CANCELLED','REJECTED') AND is_test = false), 0) AS unpaid_total
FROM "v2_orders"
WHERE parent_order_id IS NULL AND order_type = 'registration'
GROUP BY year_id;

CREATE VIEW v2_option_counts AS
SELECT o.year_id,
    ff.name AS field_name,
    COALESCE(po.name, oli.value) AS option_value,
    SUM(oli.quantity)::int AS count
FROM "v2_order_line_items" oli
JOIN "v2_orders" o ON o.id = oli.order_id
JOIN "v2_form_fields" ff ON ff.id = oli.field_id
LEFT JOIN "v2_pricing_options" po ON po.id = oli.pricing_option_id
WHERE o.is_test = false AND o.status NOT IN ('CANCELLED','REJECTED')
  AND oli.value IS NOT NULL AND oli.value != '' AND oli.value != 'false'
GROUP BY o.year_id, ff.name, COALESCE(po.name, oli.value);

CREATE VIEW v2_people_count AS
SELECT o.year_id, COUNT(DISTINCT op.id) AS people_count
FROM "v2_order_people" op
JOIN "v2_orders" o ON o.id = op.order_id
WHERE o.is_test = false AND o.status NOT IN ('CANCELLED','REJECTED')
GROUP BY o.year_id;

CREATE VIEW v2_current_prices AS
SELECT
    oli.id, oli.person_id, oli.order_id, oli.pricing_option_id,
    oli.quantity, oli.unit_price_at_submission,
    CASE WHEN o.is_paid
        THEN oli.unit_price_at_submission
        ELSE COALESCE(
            (SELECT pop.price FROM "v2_pricing_option_prices" pop
             JOIN "v2_price_tiers" pt ON pt.id = pop.tier_id
             WHERE pop.option_id = oli.pricing_option_id
               AND (pt.deadline IS NULL OR pt.deadline >= now())
             ORDER BY pt.deadline ASC NULLS LAST
             LIMIT 1),
            oli.unit_price_at_submission
        )
    END AS current_unit_price
FROM "v2_order_line_items" oli
JOIN "v2_orders" o ON o.id = oli.order_id
WHERE oli.pricing_option_id IS NOT NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE FUNCTION v2_get_current_tier(p_year_id TEXT) RETURNS TEXT AS $$
SELECT pt.id FROM "v2_price_tiers" pt
WHERE pt.year_id = p_year_id
  AND (pt.deadline IS NULL OR pt.deadline >= now())
ORDER BY pt.deadline ASC NULLS LAST
LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_compute_current_total(p_order_id TEXT) RETURNS INT AS $$
SELECT COALESCE(SUM(cp.current_unit_price * cp.quantity), 0)::int
FROM v2_current_prices cp
WHERE cp.order_id = p_order_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_check_capacity(
    p_year_id TEXT, p_field_name TEXT, p_option_value TEXT, p_additional INT DEFAULT 0
) RETURNS TABLE(max_count INT, current_count BIGINT, remaining INT, would_exceed BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT cl.max_count,
        COALESCE(oc.count, 0)::BIGINT AS current_count,
        GREATEST(0, cl.max_count - COALESCE(oc.count, 0)::INT) AS remaining,
        (COALESCE(oc.count, 0) + p_additional > cl.max_count) AS would_exceed
    FROM "v2_capacity_limits" cl
    JOIN "v2_form_fields" ff ON ff.id = cl.field_id AND ff.name = p_field_name
    LEFT JOIN (
        SELECT field_name, option_value, SUM(count) AS count
        FROM v2_option_counts WHERE year_id = p_year_id
        GROUP BY field_name, option_value
    ) oc ON oc.field_name = p_field_name AND oc.option_value = p_option_value
    WHERE cl.year_id = p_year_id AND cl.option_value = p_option_value AND cl.field_id = ff.id
    FOR UPDATE OF cl;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION v2_get_form_structure(p_year_id TEXT) RETURNS JSONB AS $$
SELECT jsonb_build_object(
    'layout', rf.fields,
    'fields', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', ff.id, 'legacyId', ff.legacy_id, 'name', ff.name, 'label', ff.label,
            'type', ff.type, 'required', ff.required, 'editable', ff.editable,
            'pricingDefinitionId', ff.pricing_definition_id,
            'includeForAdditionalPeople', ff.include_for_additional_people,
            'options', ff.options, 'sortOrder', ff.sort_order
        ) ORDER BY ff.sort_order), '[]'::jsonb)
        FROM "v2_form_fields" ff WHERE ff.year_id = p_year_id AND ff.is_active
    ),
    'pricingDefinitions', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', pd.id, 'name', pd.name, 'type', pd.type,
            'multiSelect', pd.multi_select, 'unitName', pd.unit_name,
            'usePriceTiers', pd.use_price_tiers,
            'options', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'id', po.id, 'name', po.name, 'description', po.description,
                    'prices', (
                        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                            'tierId', pop.tier_id, 'price', pop.price
                        )), '[]'::jsonb)
                        FROM "v2_pricing_option_prices" pop WHERE pop.option_id = po.id
                    )
                ) ORDER BY po.sort_order), '[]'::jsonb)
                FROM "v2_pricing_options" po WHERE po.definition_id = pd.id AND po.is_active
            )
        ) ORDER BY pd.sort_order), '[]'::jsonb)
        FROM "v2_pricing_definitions" pd WHERE pd.year_id = p_year_id AND pd.is_active
    ),
    'conditions', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', fc.id, 'name', fc.name,
            'rules', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'fieldId', fcr.field_id, 'operator', fcr.operator,
                    'value', fcr.value, 'connector', fcr.connector
                ) ORDER BY fcr.sort_order), '[]'::jsonb)
                FROM "v2_form_condition_rules" fcr WHERE fcr.condition_id = fc.id
            )
        ) ORDER BY fc.sort_order), '[]'::jsonb)
        FROM "v2_form_conditions" fc WHERE fc.year_id = p_year_id
    ),
    'capacityLimits', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', cl.id, 'fieldId', cl.field_id,
            'optionValue', cl.option_value, 'maxCount', cl.max_count
        )), '[]'::jsonb)
        FROM "v2_capacity_limits" cl WHERE cl.year_id = p_year_id
    ),
    'priceTiers', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', pt.id, 'deadline', pt.deadline, 'sortOrder', pt.sort_order
        ) ORDER BY pt.sort_order), '[]'::jsonb)
        FROM "v2_price_tiers" pt WHERE pt.year_id = p_year_id
    )
)
FROM "registration_forms" rf WHERE rf."yearId" = p_year_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_get_registration_summary(p_year_id TEXT) RETURNS JSONB AS $$
SELECT jsonb_build_object(
    'registrations', COALESCE(s.registrations, 0),
    'confirmed', COALESCE(s.confirmed, 0),
    'pending', COALESCE(s.pending, 0),
    'waitlist', COALESCE(s.waitlist, 0),
    'paidTotal', COALESCE(s.paid_total, 0),
    'unpaidTotal', COALESCE(s.unpaid_total, 0),
    'people', COALESCE(p.people_count, 0)
)
FROM (SELECT 1) _
LEFT JOIN v2_order_status_summary s ON s.year_id = p_year_id
LEFT JOIN v2_people_count p ON p.year_id = p_year_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_get_option_counts(
    p_year_id TEXT,
    p_field_names TEXT[] DEFAULT NULL,  -- NULL = all fields
    p_statuses TEXT[] DEFAULT NULL,     -- NULL = exclude CANCELLED/REJECTED; set to filter specific
    p_is_paid BOOLEAN DEFAULT NULL      -- NULL = all; true/false to filter
) RETURNS JSONB AS $$
SELECT COALESCE(jsonb_object_agg(sub.field_name, jsonb_build_object(
    'counts', sub.counts,
    'capacityLimits', sub.limits
)), '{}'::jsonb)
FROM (
    SELECT
        oc.field_name,
        jsonb_object_agg(oc.option_value, oc.count) AS counts,
        (SELECT COALESCE(jsonb_object_agg(cl.option_value, cl.max_count), '{}'::jsonb)
         FROM "v2_capacity_limits" cl
         JOIN "v2_form_fields" ff ON ff.id = cl.field_id
         WHERE ff.name = oc.field_name AND cl.year_id = p_year_id
        ) AS limits
    FROM (
    SELECT
        ff.name AS field_name,
        COALESCE(po.name, oli.value) AS option_value,
        SUM(oli.quantity)::int AS count
    FROM "v2_order_line_items" oli
    JOIN "v2_orders" o ON o.id = oli.order_id
    JOIN "v2_form_fields" ff ON ff.id = oli.field_id
    LEFT JOIN "v2_pricing_options" po ON po.id = oli.pricing_option_id
    WHERE o.year_id = p_year_id AND o.is_test = false
      AND (p_field_names IS NULL OR ff.name = ANY(p_field_names))
      AND (p_statuses IS NULL OR o.status = ANY(p_statuses))
      AND (p_is_paid IS NULL OR o.is_paid = p_is_paid)
      AND CASE WHEN p_statuses IS NULL THEN o.status NOT IN ('CANCELLED','REJECTED') ELSE true END
      AND oli.value IS NOT NULL AND oli.value != '' AND oli.value != 'false'
    GROUP BY ff.name, COALESCE(po.name, oli.value)
    ) oc
    GROUP BY oc.field_name
) sub;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_get_order_detail(p_order_id TEXT) RETURNS JSONB AS $$
SELECT jsonb_build_object(
    'order', row_to_json(o),
    'people', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', op.id, 'personIndex', op.person_index,
            'lineItems', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'fieldName', ff.name, 'fieldLabel', ff.label, 'fieldType', ff.type,
                    'value', oli.value,
                    'pricingOptionName', po.name,
                    'quantity', oli.quantity,
                    'unitPriceAtSubmission', oli.unit_price_at_submission,
                    'currentUnitPrice', cp.current_unit_price
                )), '[]'::jsonb)
                FROM "v2_order_line_items" oli
                JOIN "v2_form_fields" ff ON ff.id = oli.field_id
                LEFT JOIN "v2_pricing_options" po ON po.id = oli.pricing_option_id
                LEFT JOIN v2_current_prices cp ON cp.id = oli.id
                WHERE oli.person_id = op.id
            )
        ) ORDER BY op.person_index), '[]'::jsonb)
        FROM "v2_order_people" op WHERE op.order_id = o.id
    ),
    'currentTotal', v2_compute_current_total(o.id)
)
FROM "v2_orders" o WHERE o.id = p_order_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION v2_get_value_rows(p_year_id TEXT, p_field_names TEXT[]) RETURNS JSONB AS $$
SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'orderId', oli.order_id,
    'personId', oli.person_id,
    'fieldName', ff.name,
    'value', oli.value
)), '[]'::jsonb)
FROM "v2_order_line_items" oli
JOIN "v2_orders" o ON o.id = oli.order_id
JOIN "v2_form_fields" ff ON ff.id = oli.field_id
WHERE oli.year_id = p_year_id
  AND o.is_test = false AND o.status NOT IN ('CANCELLED', 'REJECTED')
  AND ff.name = ANY(p_field_names);
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- CAPACITY ENFORCEMENT TRIGGER
-- ============================================================================

CREATE FUNCTION v2_enforce_capacity_limit() RETURNS TRIGGER AS $$
DECLARE
    v_field_name TEXT; v_option_name TEXT;
    v_current_count INT; v_max_count INT;
BEGIN
    IF NEW.pricing_option_id IS NULL THEN RETURN NEW; END IF;

    SELECT ff.name INTO v_field_name FROM "v2_form_fields" ff WHERE ff.id = NEW.field_id;
    SELECT po.name INTO v_option_name FROM "v2_pricing_options" po WHERE po.id = NEW.pricing_option_id;

    SELECT cl.max_count INTO v_max_count
    FROM "v2_capacity_limits" cl
    JOIN "v2_form_fields" ff ON ff.id = cl.field_id
    WHERE ff.name = v_field_name AND cl.option_value = v_option_name AND cl.year_id = NEW.year_id;

    IF v_max_count IS NOT NULL THEN
        SELECT COALESCE(SUM(oc.count), 0) INTO v_current_count
        FROM v2_option_counts oc
        WHERE oc.year_id = NEW.year_id AND oc.field_name = v_field_name AND oc.option_value = v_option_name;

        IF v_current_count + NEW.quantity > v_max_count THEN
            RAISE EXCEPTION 'Capacity exceeded for "%" (current: %, max: %, requested: %)',
                v_option_name, v_current_count, v_max_count, NEW.quantity;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_v2_enforce_capacity
BEFORE INSERT ON "v2_order_line_items"
FOR EACH ROW EXECUTE FUNCTION v2_enforce_capacity_limit();
