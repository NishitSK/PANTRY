import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import Product from '../models/Product'
import { IProduct } from '../models/Product'

// Load environment variables
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local')
    process.exit(1)
}

async function generateRefJson() {
    try {
        await mongoose.connect(MONGODB_URI as string)
        console.log('Connected to MongoDB')

        const products = await Product.find({}).lean() as unknown as IProduct[]

        const exportData = products.map(p => ({
            name: p.name,
            category: p.category,
            shelfLife: {
                pantry: p.roomTempShelfLifeDays || null,
                fridge: p.fridgeShelfLifeDays || null,
                freezer: p.freezerShelfLifeDays || null,
                base: p.baseShelfLifeDays
            },
            defaultStorage: p.defaultStorageMethodId // Note: This is an ID, normally we'd populate it but this is a raw dump
        }))

        const outputPath = path.join(process.cwd(), 'public', 'expiry_reference.json')
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))

        console.log(`Successfully exported ${products.length} products to ${outputPath}`)

    } catch (error) {
        console.error('Error generating JSON:', error)
    } finally {
        await mongoose.disconnect()
    }
}

generateRefJson()
