# Task 3 - Prisma Seed File Creation

## Summary
Created comprehensive Prisma seed file at `/home/z/my-project/prisma/seed.ts` for the POS (Point of Sale) system.

## What was created
- **2 Users**: Admin (admin@kasirku.com / admin123, role=admin) and Kasir 1 (kasir@kasirku.com / kasir123, role=kasir) with bcryptjs-hashed passwords
- **8 Categories**: Makanan, Minuman, Snack, Alat Tulis, Rumah Tangga, Elektronik, Kesehatan, Lainnya — each with appropriate Lucide icon names and distinct colors
- **31 Products**: Spread across all 8 categories with realistic Indonesian product names, barcodes, IDR prices (costPrice < price), reasonable stock levels, minStock, and units
- **1 StoreConfig**: KasirKu POS with Jakarta address, phone, 10% tax rate, and Indonesian receipt footer
- **19 Transactions**: Spanning the last 30 days, including 4 today's transactions, with varying items (1-5 items per transaction), all payment methods (cash/card/qris/transfer), discount types (nominal/percent), customer names or walk-in (null), one voided transaction, proper invoice numbers (INV-YYYYMMDD-NNN), and calculated tax/paid/change
- **12 StockLog entries**: Stock-in (restocking), stock-out (damaged/expired), and adjustments (stok opname)

## Technical details
- Uses `import { db } from '@/lib/db'` for Prisma client
- Uses `bcryptjs` for password hashing (10 salt rounds)
- Follows `async function main()` + `main().catch(console.error)` pattern
- Auto-generated cuid IDs (not specified manually)
- Proper foreign key ordering for deletions
- All prices in integer IDR (no decimals) matching the schema's Int type
- 10% tax calculated after discount
- Cash payments rounded up to nearest 10000

## Verification
Seed ran successfully with output:
```
✅ Users created
✅ Categories created
✅ 31 Products created
✅ Store config created
✅ 19 Transactions created
✅ 12 Stock logs created
🎉 Seeding complete!
```
