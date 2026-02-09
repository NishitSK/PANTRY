require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file')
  process.exit(1)
}

// Define schemas inline for seeding
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  city: { type: String, default: 'London' }
}, { timestamps: true })

const StorageMethodSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  tempRangeMinC: { type: Number, required: true },
  tempRangeMaxC: { type: Number, required: true },
  humidityPreferred: { type: Number, required: true }
}, { _id: false })

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  baseShelfLifeDays: { type: Number, required: true },
  roomTempShelfLifeDays: Number,
  fridgeShelfLifeDays: Number,
  freezerShelfLifeDays: Number,
  storageNotes: String,
  defaultStorageMethodId: { type: String, required: true, ref: 'StorageMethod' }
}, { timestamps: true })

const RecipeIngredientSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { _id: false })

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: String,
  ingredients: { type: [RecipeIngredientSchema], default: [] }
}, { timestamps: true })

const InventoryItemSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  productId: { type: String, required: true, ref: 'Product' },
  storageMethodId: { type: String, required: true, ref: 'StorageMethod' },
  purchasedAt: { type: Date, required: true },
  openedAt: Date,
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  notes: String
}, { timestamps: true })

const WeatherSnapshotSchema = new mongoose.Schema({
  inventoryItemId: { type: String, required: true, ref: 'InventoryItem' },
  capturedAt: { type: Date, default: Date.now },
  tempC: { type: Number, required: true },
  humidity: { type: Number, required: true }
})

const PredictionSchema = new mongoose.Schema({
  inventoryItemId: { type: String, required: true, ref: 'InventoryItem' },
  predictedExpiry: { type: Date, required: true },
  modelVersion: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  createdAt: { type: Date, default: Date.now }
})

// Create or retrieve models
const User = mongoose.models.User || mongoose.model('User', UserSchema)
const StorageMethod = mongoose.models.StorageMethod || mongoose.model('StorageMethod', StorageMethodSchema)
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)
const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema)
const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema)
const WeatherSnapshot = mongoose.models.WeatherSnapshot || mongoose.model('WeatherSnapshot', WeatherSnapshotSchema)
const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema)

async function main() {
  console.log('🌱 Starting MongoDB seed...')
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Create storage methods
    const storageMethodsData = [
      { _id: 'room', name: 'Room Temperature', tempRangeMinC: 18, tempRangeMaxC: 25, humidityPreferred: 50 },
      { _id: 'fridge', name: 'Refrigerator', tempRangeMinC: 2, tempRangeMaxC: 5, humidityPreferred: 65 },
      { _id: 'freezer', name: 'Freezer', tempRangeMinC: -20, tempRangeMaxC: -10, humidityPreferred: 70 }
    ]

    for (const sm of storageMethodsData) {
      await StorageMethod.findByIdAndUpdate(sm._id, sm, { upsert: true, new: true })
    }

    console.log('✅ Storage methods created')

    // Create Recipes
    const recipes = [
      {
        title: "Classic Tomato Pasta",
        description: "A simple yet delicious pasta dish with fresh tomatoes and basil.",
        instructions: "Boil pasta. Sauté garlic and tomatoes. Mix and serve with basil.",
        ingredients: [
          { name: "Pasta" }, { name: "Tomato" }, { name: "Garlic" },
          { name: "Basil" }, { name: "Olive Oil" }, { name: "Salt" }
        ]
      },
      {
        title: "Vegetable Stir Fry",
        description: "Quick and healthy stir fry with mixed vegetables.",
        instructions: "Chop vegetables. Stir fry in hot oil with soy sauce. Serve over rice.",
        ingredients: [
          { name: "Rice" }, { name: "Carrot" }, { name: "Broccoli" },
          { name: "Bell Pepper" }, { name: "Soy Sauce" }, { name: "Ginger" }, { name: "Garlic" }
        ]
      },
      {
        title: "Banana Pancakes",
        description: "Fluffy pancakes made with ripe bananas.",
        instructions: "Mash bananas. Mix with flour, eggs, and milk. Cook on griddle.",
        ingredients: [
          { name: "Banana" }, { name: "Flour" }, { name: "Egg" },
          { name: "Milk" }, { name: "Butter" }, { name: "Maple Syrup" }
        ]
      }
    ]

    for (const recipe of recipes) {
      await Recipe.findOneAndUpdate(
        { title: recipe.title },
        recipe,
        { upsert: true, new: true }
      )
    }
    console.log('✅ Recipes created')

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo1234', 12)
    
    const demoUser = await User.findOneAndUpdate(
      { email: 'demo@example.com' },
      {
        email: 'demo@example.com',
        name: 'Demo User',
        passwordHash: hashedPassword,
        city: 'London'
      },
      { upsert: true, new: true }
    )

    console.log('✅ Demo user created')

    // Sample products
    const productsData = [
      // Fresh Fruits
      { name: 'Apples', category: 'Fresh Fruits', base: 7, room: 14, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool, dark place' },
      { name: 'Bananas', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Keep at room temperature until ripe' },
      { name: 'Oranges', category: 'Fresh Fruits', base: 10, room: 14, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool place' },
      { name: 'Strawberries', category: 'Fresh Fruits', base: 3, room: 1, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Highly perishable' },
      { name: 'Grapes', category: 'Fresh Fruits', base: 5, room: 2, fridge: 14, freezer: 365, storage: 'fridge', notes: 'Refrigerate unwashed' },
      
      // Fresh Vegetables  
      { name: 'Tomatoes', category: 'Fresh Vegetables', base: 7, room: 7, fridge: 14, freezer: 180, storage: 'room', notes: 'Best flavor at room temp' },
      { name: 'Lettuce', category: 'Fresh Vegetables', base: 5, room: 0, fridge: 10, freezer: 0, storage: 'fridge', notes: 'Wash before storing' },
      { name: 'Carrots', category: 'Fresh Vegetables', base: 14, room: 7, fridge: 28, freezer: 365, storage: 'fridge', notes: 'Remove greens before storing' },
      { name: 'Broccoli', category: 'Fresh Vegetables', base: 5, room: 1, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Store unwashed' },
      { name: 'Potatoes', category: 'Fresh Vegetables', base: 30, room: 30, fridge: 90, freezer: 365, storage: 'room', notes: 'Store in dark, cool place' },
      
      // Dairy
      { name: 'Milk', category: 'Dairy', base: 7, room: 0, fridge: 7, freezer: 90, storage: 'fridge', notes: 'Must refrigerate' },
      { name: 'Cheddar Cheese', category: 'Dairy', base: 21, room: 0, fridge: 60, freezer: 180, storage: 'fridge', notes: 'Wrap tightly' },
      { name: 'Yogurt', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 60, storage: 'fridge', notes: 'Check expiry date' },
      { name: 'Butter', category: 'Dairy', base: 30, room: 7, fridge: 90, freezer: 365, storage: 'fridge', notes: 'Can freeze' },
      
      // Meat & Poultry
      { name: 'Chicken Breast', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 270, storage: 'fridge', notes: 'Cook within 2 days' },
      { name: 'Ground Beef', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 120, storage: 'fridge', notes: 'Highly perishable' },
      { name: 'Bacon', category: 'Meat & Poultry', base: 7, room: 0, fridge: 14, freezer: 30, storage: 'fridge', notes: 'Cured meat' },
      
      // Eggs & Tofu
      { name: 'Eggs', category: 'Eggs & Tofu', base: 28, room: 7, fridge: 35, freezer: 365, storage: 'fridge', notes: 'Keep in carton' },
      { name: 'Tofu', category: 'Eggs & Tofu', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Keep in water' },
      
      // Bakery
      { name: 'Bread', category: 'Bakery', base: 5, room: 5, fridge: 14, freezer: 180, storage: 'room', notes: 'Store in cool, dry place' },
      { name: 'Bagels', category: 'Bakery', base: 5, room: 3, fridge: 14, freezer: 180, storage: 'room', notes: 'Dense bread' },
      
      // Pantry Staples
      { name: 'Rice', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Long shelf life' },
      { name: 'Pasta', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Dry pasta' },
      { name: 'Olive Oil', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'room', notes: 'Store in dark place' },
    ]

    const storageMap = { 'room': 'room', 'fridge': 'fridge', 'freezer': 'freezer' }

    let createdCount = 0
    for (const p of productsData) {
      await Product.findOneAndUpdate(
        { name: p.name },
        {
          name: p.name,
          category: p.category,
          baseShelfLifeDays: p.base,
          roomTempShelfLifeDays: p.room,
          fridgeShelfLifeDays: p.fridge,
          freezerShelfLifeDays: p.freezer,
          storageNotes: p.notes,
          defaultStorageMethodId: storageMap[p.storage]
        },
        { upsert: true, new: true }
      )
      createdCount++
    }

    console.log(`✅ All ${createdCount} products created`)

    // Create a sample inventory item for demo user
    const chickenProduct = await Product.findOne({ name: 'Chicken Breast' })

    if (chickenProduct && demoUser) {
      const purchasedAt = new Date()
      purchasedAt.setDate(purchasedAt.getDate() - 1) // Purchased yesterday

      const item = await InventoryItem.create({
        userId: demoUser._id.toString(),
        productId: chickenProduct._id.toString(),
        storageMethodId: 'fridge',
        purchasedAt,
        quantity: 2,
        unit: 'pieces',
        notes: 'Sample item for demo'
      })

      // Create weather snapshot
      await WeatherSnapshot.create({
        inventoryItemId: item._id.toString(),
        tempC: 4,
        humidity: 65
      })

      // Create prediction
      await Prediction.create({
        inventoryItemId: item._id.toString(),
        predictedExpiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expires tomorrow
        confidence: 0.85,
        modelVersion: 'rb-1.1'
      })

      console.log('✅ Sample inventory item created')
    }

    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
  }
}

main()
