import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      name: "Administrator",
      password: hashedPassword,
      role: "admin",
      active: true,
    },
    create: {
      name: "Admin KasirKu",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
      active: true,
    },
  });

  // Create kasir user
  const kasirPassword = await bcrypt.hash("kasir123", 10);

  const kasir = await db.user.upsert({
    where: { email: "kasir@gmail.com" },
    update: {
      name: "Kasir 1",
      password: kasirPassword,
      role: "kasir",
      active: true,
    },
    create: {
      name: "Kasir 1",
      email: "kasir@gmail.com",
      password: kasirPassword,
      role: "kasir",
      active: true,
    },
  });

  // Create categories
  const categories = await Promise.all([
    db.category.upsert({
      where: { name: "Makanan" },
      update: {},
      create: { name: "Makanan", icon: "UtensilsCrossed", color: "#f97316" },
    }),
    db.category.upsert({
      where: { name: "Minuman" },
      update: {},
      create: { name: "Minuman", icon: "Coffee", color: "#3b82f6" },
    }),
    db.category.upsert({
      where: { name: "Snack" },
      update: {},
      create: { name: "Snack", icon: "Cookie", color: "#eab308" },
    }),
    db.category.upsert({
      where: { name: "Sembako" },
      update: {},
      create: { name: "Sembako", icon: "ShoppingBag", color: "#22c55e" },
    }),
    db.category.upsert({
      where: { name: "Lainnya" },
      update: {},
      create: { name: "Lainnya", icon: "Package", color: "#8b5cf6" },
    }),
    db.category.upsert({
      where: { name: "Alat Tulis" },
      update: {},
      create: { name: "Alat Tulis", icon: "Pencil", color: "#ef4444" },
    }),
    db.category.upsert({
      where: { name: "Elektronik" },
      update: {},
      create: { name: "Elektronik", icon: "Monitor", color: "#06b6d4" },
    }),
    db.category.upsert({
      where: { name: "Kesehatan" },
      update: {},
      create: { name: "Kesehatan", icon: "Heart", color: "#ec4899" },
    }),
    db.category.upsert({
      where: { name: "Rumah Tangga" },
      update: {},
      create: { name: "Rumah Tangga", icon: "Home", color: "#d97706" },
    }),
  ]);

  // Image color mapping per category index
  // 0=Makanan(f97316), 1=Minuman(3b82f6), 2=Snack(eab308), 3=Sembako(22c55e),
  // 4=Lainnya(8b5cf6), 5=Alat Tulis(ef4444), 6=Elektronik(06b6d4),
  // 7=Kesehatan(ec4899), 8=Rumah Tangga(d97706)
  const catColors = [
    "f97316",
    "3b82f6",
    "eab308",
    "22c55e",
    "8b5cf6",
    "ef4444",
    "06b6d4",
    "ec4899",
    "d97706",
  ];

  function imgUrl(catIdx: number, name: string) {
    const text = name.replace(/ /g, "+");
    return `https://placehold.co/300x300/${catColors[catIdx]}/white?text=${text}`;
  }

  // Create sample products
  const products = [
    // Makanan (catIdx=0)
    {
      name: "Nasi Goreng",
      barcode: "8901001",
      price: 15000,
      costPrice: 8000,
      stock: 50,
      categoryId: categories[0].id,
      unit: "porsi",
      image: imgUrl(0, "Nasi Goreng"),
    },
    {
      name: "Mie Goreng",
      barcode: "8901002",
      price: 13000,
      costPrice: 6000,
      stock: 40,
      categoryId: categories[0].id,
      unit: "porsi",
      image: imgUrl(0, "Mie Goreng"),
    },
    {
      name: "Ayam Goreng",
      barcode: "8901003",
      price: 20000,
      costPrice: 12000,
      stock: 30,
      categoryId: categories[0].id,
      unit: "porsi",
      image: imgUrl(0, "Ayam Goreng"),
    },
    {
      name: "Sate Ayam",
      barcode: "8901004",
      price: 25000,
      costPrice: 15000,
      stock: 25,
      categoryId: categories[0].id,
      unit: "porsi",
      image: imgUrl(0, "Sate Ayam"),
    },
    {
      name: "Bakso",
      barcode: "8901005",
      price: 12000,
      costPrice: 6000,
      stock: 35,
      categoryId: categories[0].id,
      unit: "mangkok",
      image: imgUrl(0, "Bakso"),
    },

    // Minuman (catIdx=1)
    {
      name: "Es Teh Manis",
      barcode: "8902001",
      price: 5000,
      costPrice: 1500,
      stock: 100,
      categoryId: categories[1].id,
      unit: "gelas",
      image: imgUrl(1, "Es Teh Manis"),
    },
    {
      name: "Es Jeruk",
      barcode: "8902002",
      price: 7000,
      costPrice: 2500,
      stock: 80,
      categoryId: categories[1].id,
      unit: "gelas",
      image: imgUrl(1, "Es Jeruk"),
    },
    {
      name: "Kopi Hitam",
      barcode: "8902003",
      price: 6000,
      costPrice: 2000,
      stock: 90,
      categoryId: categories[1].id,
      unit: "gelas",
      image: imgUrl(1, "Kopi Hitam"),
    },
    {
      name: "Jus Alpukat",
      barcode: "8902004",
      price: 12000,
      costPrice: 5000,
      stock: 40,
      categoryId: categories[1].id,
      unit: "gelas",
      image: imgUrl(1, "Jus Alpukat"),
    },
    {
      name: "Air Mineral 600ml",
      barcode: "8902005",
      price: 4000,
      costPrice: 2000,
      stock: 120,
      categoryId: categories[1].id,
      unit: "botol",
      image: imgUrl(1, "Air Mineral"),
    },

    // Snack (catIdx=2)
    {
      name: "Keripik Singkong",
      barcode: "8903001",
      price: 8000,
      costPrice: 4000,
      stock: 60,
      categoryId: categories[2].id,
      unit: "bungkus",
      image: imgUrl(2, "Keripik Singkong"),
    },
    {
      name: "Kacang Goreng",
      barcode: "8903002",
      price: 10000,
      costPrice: 5000,
      stock: 45,
      categoryId: categories[2].id,
      unit: "bungkus",
      image: imgUrl(2, "Kacang Goreng"),
    },
    {
      name: "Roti Cokelat",
      barcode: "8903003",
      price: 6000,
      costPrice: 3000,
      stock: 70,
      categoryId: categories[2].id,
      unit: "bungkus",
      image: imgUrl(2, "Roti Cokelat"),
    },
    {
      name: "Wafer Stroberi",
      barcode: "8903004",
      price: 5000,
      costPrice: 2500,
      stock: 55,
      categoryId: categories[2].id,
      unit: "bungkus",
      image: imgUrl(2, "Wafer Stroberi"),
    },

    // Sembako (catIdx=3)
    {
      name: "Beras 5kg",
      barcode: "8904001",
      price: 65000,
      costPrice: 55000,
      stock: 20,
      categoryId: categories[3].id,
      unit: "karung",
      image: imgUrl(3, "Beras 5kg"),
    },
    {
      name: "Minyak Goreng 1L",
      barcode: "8904002",
      price: 18000,
      costPrice: 14000,
      stock: 35,
      categoryId: categories[3].id,
      unit: "botol",
      image: imgUrl(3, "Minyak Goreng"),
    },
    {
      name: "Gula Pasir 1kg",
      barcode: "8904003",
      price: 14000,
      costPrice: 11000,
      stock: 40,
      categoryId: categories[3].id,
      unit: "kg",
      image: imgUrl(3, "Gula Pasir"),
    },
    {
      name: "Telur 1kg",
      barcode: "8904004",
      price: 28000,
      costPrice: 22000,
      stock: 30,
      categoryId: categories[3].id,
      unit: "kg",
      image: imgUrl(3, "Telur 1kg"),
    },
    {
      name: "Tepung Terigu 1kg",
      barcode: "8904005",
      price: 12000,
      costPrice: 9000,
      stock: 35,
      categoryId: categories[3].id,
      unit: "kg",
      image: imgUrl(3, "Tepung Terigu"),
    },

    // Lainnya (catIdx=4)
    {
      name: "Plastik Kresek",
      barcode: "8905001",
      price: 2000,
      costPrice: 800,
      stock: 200,
      categoryId: categories[4].id,
      unit: "lusin",
      image: imgUrl(4, "Plastik Kresek"),
    },
    {
      name: "Tisu Meja",
      barcode: "8905002",
      price: 5000,
      costPrice: 2500,
      stock: 60,
      categoryId: categories[4].id,
      unit: "rim",
      image: imgUrl(4, "Tisu Meja"),
    },

    // Alat Tulis (catIdx=5)
    {
      name: "Pulpen",
      barcode: "8906001",
      price: 3000,
      costPrice: 1500,
      stock: 100,
      categoryId: categories[5].id,
      unit: "pcs",
      image: imgUrl(5, "Pulpen"),
    },
    {
      name: "Buku Tulis",
      barcode: "8906002",
      price: 5000,
      costPrice: 2500,
      stock: 80,
      categoryId: categories[5].id,
      unit: "pcs",
      image: imgUrl(5, "Buku Tulis"),
    },
    {
      name: "Pensil 2B",
      barcode: "8906003",
      price: 2000,
      costPrice: 800,
      stock: 120,
      categoryId: categories[5].id,
      unit: "pcs",
      image: imgUrl(5, "Pensil 2B"),
    },
    {
      name: "Penghapus",
      barcode: "8906004",
      price: 1500,
      costPrice: 500,
      stock: 90,
      categoryId: categories[5].id,
      unit: "pcs",
      image: imgUrl(5, "Penghapus"),
    },
    {
      name: "Penggaris 30cm",
      barcode: "8906005",
      price: 3000,
      costPrice: 1200,
      stock: 60,
      categoryId: categories[5].id,
      unit: "pcs",
      image: imgUrl(5, "Penggaris"),
    },

    // Elektronik (catIdx=6)
    {
      name: "Charger USB",
      barcode: "8907001",
      price: 25000,
      costPrice: 15000,
      stock: 20,
      categoryId: categories[6].id,
      unit: "pcs",
      image: imgUrl(6, "Charger USB"),
    },
    {
      name: "Earphone",
      barcode: "8907002",
      price: 35000,
      costPrice: 20000,
      stock: 15,
      categoryId: categories[6].id,
      unit: "pcs",
      image: imgUrl(6, "Earphone"),
    },
    {
      name: "Baterai AA",
      barcode: "8907003",
      price: 8000,
      costPrice: 4000,
      stock: 50,
      categoryId: categories[6].id,
      unit: "pcs",
      image: imgUrl(6, "Baterai AA"),
    },
    {
      name: "Kabel Data",
      barcode: "8907004",
      price: 15000,
      costPrice: 7000,
      stock: 25,
      categoryId: categories[6].id,
      unit: "pcs",
      image: imgUrl(6, "Kabel Data"),
    },

    // Kesehatan (catIdx=7)
    {
      name: "Masker Medis",
      barcode: "8908001",
      price: 5000,
      costPrice: 2000,
      stock: 100,
      categoryId: categories[7].id,
      unit: "pcs",
      image: imgUrl(7, "Masker Medis"),
    },
    {
      name: "Hand Sanitizer",
      barcode: "8908002",
      price: 12000,
      costPrice: 6000,
      stock: 40,
      categoryId: categories[7].id,
      unit: "botol",
      image: imgUrl(7, "Hand Sanitizer"),
    },
    {
      name: "Betadine 30ml",
      barcode: "8908003",
      price: 15000,
      costPrice: 8000,
      stock: 30,
      categoryId: categories[7].id,
      unit: "botol",
      image: imgUrl(7, "Betadine"),
    },
    {
      name: "Paracetamol",
      barcode: "8908004",
      price: 8000,
      costPrice: 4000,
      stock: 50,
      categoryId: categories[7].id,
      unit: "strip",
      image: imgUrl(7, "Paracetamol"),
    },
    {
      name: "Kapas Roll",
      barcode: "8908005",
      price: 6000,
      costPrice: 3000,
      stock: 45,
      categoryId: categories[7].id,
      unit: "roll",
      image: imgUrl(7, "Kapas Roll"),
    },

    // Rumah Tangga (catIdx=8)
    {
      name: "Sabun Cuci Piring",
      barcode: "8909001",
      price: 8000,
      costPrice: 4000,
      stock: 50,
      categoryId: categories[8].id,
      unit: "botol",
      image: imgUrl(8, "Sabun Cuci Piring"),
    },
    {
      name: "Spon",
      barcode: "8909002",
      price: 3000,
      costPrice: 1000,
      stock: 80,
      categoryId: categories[8].id,
      unit: "pcs",
      image: imgUrl(8, "Spon"),
    },
    {
      name: "Sapu",
      barcode: "8909003",
      price: 15000,
      costPrice: 8000,
      stock: 20,
      categoryId: categories[8].id,
      unit: "pcs",
      image: imgUrl(8, "Sapu"),
    },
    {
      name: "Pel Lantai",
      barcode: "8909004",
      price: 20000,
      costPrice: 12000,
      stock: 15,
      categoryId: categories[8].id,
      unit: "pcs",
      image: imgUrl(8, "Pel Lantai"),
    },
    {
      name: "Deterjen 800g",
      barcode: "8909005",
      price: 12000,
      costPrice: 7000,
      stock: 40,
      categoryId: categories[8].id,
      unit: "pcs",
      image: imgUrl(8, "Deterjen"),
    },
  ];

  for (const product of products) {
    await db.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: product,
    });
  }

  // Create store config
  await db.storeConfig.upsert({
    where: { id: "store-config-1" },
    update: {},
    create: {
      id: "store-config-1",
      storeName: "KasirKu POS",
      address: "Jl. Contoh No. 123, Jakarta",
      phone: "021-1234567",
      taxRate: 10,
      receiptFooter: "Terima kasih atas kunjungan Anda!",
    },
  });

  console.log(`✅ Created users: ${admin.name}, ${kasir.name}`);
  console.log(`✅ Created ${categories.length} categories`);
  console.log(`✅ Created ${products.length} products`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
