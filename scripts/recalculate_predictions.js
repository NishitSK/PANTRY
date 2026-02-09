
const { PrismaClient } = require('@prisma/client')
const { addDays } = require('date-fns')

const prisma = new PrismaClient()

// Copy of the predict function from lib/prediction.ts
// Since we can't easily import TS in this JS script without compilation
function predict(inputs) {
  const { 
    baseShelfLifeDays, 
    roomTempShelfLifeDays, 
    fridgeShelfLifeDays, 
    freezerShelfLifeDays,
    storageMethodName,
    tempMinC, 
    tempMaxC, 
    humidityPreferred, 
    tempC, 
    humidity, 
    purchasedAt, 
    openedAt 
  } = inputs
  
  let days = baseShelfLifeDays
  const methodLower = storageMethodName.toLowerCase()
  
  if (methodLower.includes('room') && roomTempShelfLifeDays !== undefined && roomTempShelfLifeDays !== null) {
    days = roomTempShelfLifeDays
  } else if ((methodLower.includes('fridge') || methodLower.includes('refrig')) && fridgeShelfLifeDays !== undefined && fridgeShelfLifeDays !== null) {
    days = fridgeShelfLifeDays
  } else if (methodLower.includes('freezer') && freezerShelfLifeDays !== undefined && freezerShelfLifeDays !== null) {
    days = freezerShelfLifeDays
  }
  let penalty = 0

  const isControlledStorage = methodLower.includes('fridge') || methodLower.includes('refrig') || methodLower.includes('freezer')

  if (!isControlledStorage) {
    if (tempC < tempMinC) {
      const diff = tempMinC - tempC
      penalty += Math.min(0.5, 0.03 * diff)
    } else if (tempC > tempMaxC) {
      const diff = tempC - tempMaxC
      penalty += Math.min(0.5, 0.03 * diff)
    }

    const humidityDiff = Math.abs(humidity - humidityPreferred)
    penalty += Math.min(0.2, 0.003 * humidityDiff)
  }

  if (openedAt) penalty += 0.25

  const effective = Math.max(0, days * (1 - penalty))
  const predictedExpiry = addDays(purchasedAt, Math.round(effective))
  
  let confidence = 0.8 - penalty
  confidence = Math.max(0.5, Math.min(0.9, confidence))

  return { predictedExpiry, confidence, modelVersion: 'rb-1.2-fix' }
}

async function main() {
  console.log('🔄 Starting prediction recalculation...')
  
  const items = await prisma.inventoryItem.findMany({
    include: {
      product: true,
      storageMethod: true,
      snapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 1
      }
    }
  })

  console.log(`Found ${items.length} items to update.`)

  for (const item of items) {
    const weather = item.snapshots[0] || { tempC: 20, humidity: 50 } // Default if no snapshot
    
    const prediction = predict({
      baseShelfLifeDays: item.product.baseShelfLifeDays,
      roomTempShelfLifeDays: item.product.roomTempShelfLifeDays,
      fridgeShelfLifeDays: item.product.fridgeShelfLifeDays,
      freezerShelfLifeDays: item.product.freezerShelfLifeDays,
      storageMethodName: item.storageMethod.name,
      tempMinC: item.storageMethod.tempRangeMinC,
      tempMaxC: item.storageMethod.tempRangeMaxC,
      humidityPreferred: item.storageMethod.humidityPreferred,
      tempC: weather.tempC,
      humidity: weather.humidity,
      purchasedAt: item.purchasedAt,
      openedAt: item.openedAt
    })

    // Create new prediction
    await prisma.prediction.create({
      data: {
        inventoryItemId: item.id,
        predictedExpiry: prediction.predictedExpiry,
        confidence: prediction.confidence,
        modelVersion: prediction.modelVersion
      }
    })
    
    console.log(`Updated: ${item.product.name} (${item.storageMethod.name}) -> Expires: ${prediction.predictedExpiry.toISOString().split('T')[0]}`)
  }

  console.log('✅ All predictions updated!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
