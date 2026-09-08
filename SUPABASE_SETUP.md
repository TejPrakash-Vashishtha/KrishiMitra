# 🗄️ SUPABASE SETUP GUIDE — KrishiMitra (AgriNexus)

Follow these steps ONCE on the Supabase Dashboard. They add the PIN‑login column,
Crop Stock notes, the last‑10‑days weather history, the last‑14‑days mandi price
history, and the order history tables. Takes about 3 minutes.

---

## Step 1 — Open your project
Go to **https://supabase.com/dashboard** → open the project used by the app
(the URL baked into the frontend is `https://ubhavqvejgapzmmpdulb.supabase.co`).

## Step 2 — Run the migration
1. In the left sidebar click **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/003_pin_weather_mandi_orders.sql` from this repo,
   copy ALL of its contents, and paste it into the editor.
3. Click **Run**.
4. You should see `Success. No rows returned` and a green check.

> ℹ️ If you have ALREADY run migrations `001` and `002`, this just adds the new
> columns/tables. If you have NOT run them yet, run `001` and `002` first, then `003`.

## Step 3 — Add missing notes column (only if Step 2 errored)
If Step 2 reports `column "notes" does not exist`, run this first, then re‑run Step 2:
```sql
ALTER TABLE farmer_inventory ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
```

## Step 4 — Enable Realtime (this makes Crop Stock LIVE everywhere)
Realtime cannot be created by SQL, it must be switched on per table:
1. Left sidebar → **Database** → **Replication** (older UIs: **Realtime**).
2. In **Source** → **supabase_realtime** enable `insert`, `update`, `delete` for the
   **`farmer_inventory`** table (and **`orders`** if you want live order updates).
3. Click **Save**.

## Step 5 — Verify the tables
Left sidebar → **Table Editor** and confirm these now exist:
- `weather_history`
- `mandi_price_history`
- `orders`
- `order_items`
- and that `farmers` has a **`pin_hash`** column.

---

## ✅ What the app expects (column names used by the frontend)
| Table               | Columns used by the app                                                   |
|---------------------|--------------------------------------------------------------------------|
| `farmers`           | `id, phone, name, village, city, state, district, pincode, address, role, pin_hash, created_at` |
| `farmer_inventory`  | `id, farmer_id, crop_name, quantity, unit, grade, storage_location, harvest_date, price_per_unit, status, notes, created_at, updated_at` |
| `weather_history`   | `id, city, district, state, weather_date, temperature, humidity, wind_speed, rainfall_chance, condition, forecast_data, created_at` |
| `mandi_price_history` | `id, mandi, district, state, crop, price, unit, price_date, change, change_percent, created_at` |
| `orders`            | `id, order_number, farmer_id, buyer_name, crop, quantity, unit, amount, status, items, created_at, updated_at` |
| `order_items`       | `id, order_id, crop, quantity, unit, price_per_unit, amount, created_at` |

---

## 🔐 Security note
The current RLS policies allow public (anon key) read/write — that is how the existing
demo works. For production, replace the `allow_all_*` policies on `farmers` and
`farmer_inventory`/`orders` with owner‑only policies:
```sql
CREATE POLICY "own_farmer" ON farmers FOR ALL USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);
```
PINs are already stored **hashed** (SHA‑256), never as plain text.