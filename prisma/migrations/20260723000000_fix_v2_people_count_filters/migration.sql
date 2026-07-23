-- Fix v2_people_count view to filter by parent_order_id and order_type,
-- matching v2_order_status_summary and preventing count divergence when
-- child orders or non-registration order types are introduced.

DROP VIEW IF EXISTS v2_people_count;

CREATE VIEW v2_people_count AS
SELECT o.year_id, COUNT(DISTINCT op.id) AS people_count
FROM "v2_order_people" op
JOIN "v2_orders" o ON o.id = op.order_id
WHERE o.is_test = false
  AND o.status NOT IN ('CANCELLED', 'REJECTED')
  AND o.parent_order_id IS NULL
  AND o.order_type = 'registration'
GROUP BY o.year_id;
