-- Fix UPDATE policy on orders table
-- This allows any active waiter to update order totals

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Waiters can update their own orders" ON orders;

-- Create new policy that allows any active waiter to update orders
CREATE POLICY "Active waiters can update orders"
ON orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
);

-- Verify the change
SELECT
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'UPDATE';