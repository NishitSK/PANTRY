# MongoDB Atlas Connection Troubleshooting

## Current Status: Connection Failing ❌

The Pantry Guardian application has been fully migrated to MongoDB, but cannot connect to MongoDB Atlas.

## Error Details
```
querySrv ECONNREFUSED _mongodb._tcp.cluster0.gmbzpff.mongodb.net
```

## Connection String (Current)
```
mongodb+srv://<username>:<password>@cluster0.gmbzpff.mongodb.net/pantry-guardian
```

## Checklist for MongoDB Atlas Setup

### 1. ✅ Verify Cluster is Running
- Go to: https://cloud.mongodb.com/
- Navigate to your project
- Check Cluster0 status should be **green "RUNNING"**
- If paused, click "Resume Cluster"

### 2. ✅ Configure Network Access
**CRITICAL**: This is the most common issue!

- Dashboard → Security → Network Access
- Click "Add IP Address"
- Option 1: Add `0.0.0.0/0` (Allow access from anywhere - for testing)
- Option 2: Add your specific IP address
- Make sure the entry shows as **ACTIVE** (not pending)

### 3. ✅ Verify Database User
- Check user `<username>` exists
- Verify password is correct
- User should have "Read and write to any database" permission

### 4. ✅ Test Internet Connection
Your computer needs internet access to reach MongoDB Atlas.

Try pinging MongoDB servers:
```bash
nslookup cluster0.gmbzpff.mongodb.net
```

If this fails, you may have DNS/firewall issues.

## Alternative Solutions

### Option A: Use Local MongoDB
If Atlas continues to fail, you can install MongoDB locally:

1. **Install MongoDB Community Edition**
   - Windows: https://www.mongodb.com/try/download/community
   - Or use MongoDB Compass (includes local server)

2. **Update connection string in `.env`:**
   ```
   MONGODB_URI="mongodb://localhost:27017/pantry-guardian"
   ```

3. **Restart dev server**

### Option B: Use MongoDB Docker Container
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use: `MONGODB_URI="mongodb://localhost:27017/pantry-guardian"`

## Next Steps

1. **Check Atlas Dashboard** - Follow checklist above
2. **Run test again**: `node test-mongodb-connection.js`
3. **Run seed**: `npm run seed`
4. **Start app**: `npm run dev`

## Support Resources
- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas/
- Network Access Docs: https://www.mongodb.com/docs/atlas/security-add-ip-address-to-list/
- Database User Docs: https://www.mongodb.com/docs/atlas/security-add-mongodb-users/
