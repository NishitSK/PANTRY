-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 1. TRIGGER: Automatically update 'updatedAt' when a row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_item_modtime
    BEFORE UPDATE ON "InventoryItem"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. ASSERTION (CHECK CONSTRAINT): Ensure quantity is non-negative
ALTER TABLE "InventoryItem" ADD CONSTRAINT "check_quantity_positive" CHECK ("quantity" >= 0);

-- 3. STORED PROCEDURE: Calculate Dashboard Stats
-- This encapsulates the logic for counting items by status
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid TEXT)
RETURNS TABLE (
    total_items BIGINT,
    expired_count BIGINT,
    expiring_soon_count BIGINT,
    fresh_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH UserItems AS (
        SELECT i.id, p."predictedExpiry"
        FROM "InventoryItem" i
        LEFT JOIN "Prediction" p ON i.id = p."inventoryItemId"
        WHERE i."userId" = user_uuid
        -- Get the latest prediction for each item
        AND (p.id IS NULL OR p."createdAt" = (
            SELECT MAX("createdAt") FROM "Prediction" WHERE "inventoryItemId" = i.id
        ))
    )
    SELECT
        COUNT(*)::BIGINT as total_items,
        COUNT(CASE WHEN "predictedExpiry" < NOW() THEN 1 END)::BIGINT as expired_count,
        COUNT(CASE WHEN "predictedExpiry" >= NOW() AND "predictedExpiry" <= (NOW() + INTERVAL '3 days') THEN 1 END)::BIGINT as expiring_soon_count,
        COUNT(CASE WHEN "predictedExpiry" > (NOW() + INTERVAL '3 days') OR "predictedExpiry" IS NULL THEN 1 END)::BIGINT as fresh_count
    FROM UserItems;
END;
$$ LANGUAGE plpgsql;
