// Alternative MongoDB connection test with different options
require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

console.log('🔍 Testing MongoDB Connection with alternative settings...')
console.log('URI (masked):', MONGODB_URI?.replace(/:[^:@]+@/, ':****@'))

async function testConnection() {
  try {
    console.log('\n⏳ Connecting with relaxed settings...')
    
    // Try with more permissive connection options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    })
    
    console.log('✅ Connected successfully!')
    console.log('Database:', mongoose.connection.name)
    console.log('Host:', mongoose.connection.host)
    console.log('Ready state:', mongoose.connection.readyState)
    
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('\n📁 Existing collections:', collections.length)
    collections.forEach(c => console.log('  -', c.name))
    
    await mongoose.disconnect()
    console.log('\n✅ Test successful!')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    if (error.cause) {
      console.error('Cause:', error.cause.message)
    }
    
    console.log('\n🔍 Debugging info:')
    console.log('- Check Atlas dashboard: https://cloud.mongodb.com/')
    console.log('- Verify cluster is RUNNING (not paused)')
    console.log('- Check Network Access has 0.0.0.0/0 whitelisted')
    console.log('- Try accessing Atlas from your browser')
    
    process.exit(1)
  }
}

testConnection()
