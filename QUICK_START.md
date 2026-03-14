# PulseControlERP - Quick Start Guide

## ✅ What's Already Installed

I've successfully set up your ERP project with the following:

### Backend (NestJS + TypeScript)
- ✅ NestJS framework configured
- ✅ TypeORM for database operations
- ✅ Passport.js + JWT authentication
- ✅ Swagger/OpenAPI documentation
- ✅ All required npm packages installed
- ✅ Environment configuration (.env) created
- ✅ Entry point (src/main.ts) configured

**Location**: `L:\App\PulseControl\backend`

### Frontend (React + TypeScript + Material-UI)
- ✅ React 19+ with TypeScript
- ✅ Material-UI components  
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ All required npm packages installed
- ✅ Login screen component created
- ✅ Environment configuration (.env) created

**Location**: `L:\App\PulseControl\frontend`

### Verification Script
- ✅ `check-installation.js` - Run this to verify setup status

---

## ⚠️ What Still Needs to Be Done

### 1. Install PostgreSQL Database

**Why**: The backend needs a database to store all ERP data.

**Download**: https://www.postgresql.org/download/windows/

**Installation Steps**:
1. Download PostgreSQL 15 or 16
2. Run installer with default settings
3. Set a password for 'postgres' user (remember this!)
4. Default port: 5432 (keep this)
5. Complete installation

**Verify Installation**:
```powershell
psql --version
```

### 2. Create Database

**After PostgreSQL is installed**:

```powershell
# Option A: Using createdb command
createdb -U postgres pulse_erp_db

# Option B: Using psql
psql -U postgres
CREATE DATABASE pulse_erp_db;
\q
```

### 3. Load Database Schema

```powershell
psql -U postgres -d pulse_erp_db -f "L:\App\PulseControl\db\schema.sql"
```

### 4. Update Backend Configuration

Edit `backend\.env` with your PostgreSQL password:

```env
DB_PASSWORD=<your-postgres-password-here>
```

---

## 🚀 Running the Application

### Terminal 1: Start Backend API

```powershell
cd L:\App\PulseControl\backend
npm run start:dev
```

**Expected Output**:
```
PulseControlERP Backend running on http://localhost:3002
Swagger docs available at http://localhost:3002/api/docs
```

### Terminal 2: Start Frontend UI

```powershell
cd L:\App\PulseControl\frontend
npm start
```

**Expected Output**:
```
Compiled successfully!

Local:   http://localhost:3001
```

> **Note**: Backend runs on **:3002**, frontend on **:3001** (set via `APP_PORT` in `backend/.env` and `PORT` in `frontend/.env`).

---

## 🌐 Access the Application

Once both servers are running:

1. **Frontend**: Open http://localhost:3001
2. **API Docs**: Open http://localhost:3002/api/docs
3. **Login Screen**: You'll see a Material-UI login form

---

## ☁️ Cloud Access (Any Laptop)

Use GitHub Codespaces to work from any laptop without local setup.

1. Push this project to GitHub.
2. Open repository → **Code** → **Codespaces** → **Create codespace on main**.
3. In Codespaces terminal, run:

```bash
cd backend && npm run start:dev
cd ../frontend && npm start
```

4. Open forwarded ports:
	- Frontend: http://localhost:3001
	- Backend API: http://localhost:3002/api/docs

> Codespaces config is included in `.devcontainer/` and PostgreSQL schema loads automatically.

---

## 📊 Current Status Summary

| Component | Status | Action Required |
|-----------|--------|----------------|
| Node.js | ✅ Installed (v24.14.0) | None |
| Backend Setup | ✅ Complete | None |
| Frontend Setup | ✅ Complete | None |
| PostgreSQL | ✅ Installed (v16.13) | None |
| Database | ✅ Created | None |
| Schema | ✅ Loaded | None |

---

## 🎯 Quick Commands Reference

### Check Installation Status
```powershell
cd L:\App\PulseControl
node check-installation.js
```

### View Documentation
```powershell
# Open documentation portal in browser
start L:\App\PulseControl\index.html
```

### Backend Commands
```powershell
cd L:\App\PulseControl\backend

# Install dependencies (already done)
npm install

# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Commands
```powershell
cd L:\App\PulseControl\frontend

# Install dependencies (already done)
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Database Commands
```powershell
# Create database
createdb -U postgres pulse_erp_db

# Load schema
psql -U postgres -d pulse_erp_db -f "L:\App\PulseControl\db\schema.sql"

# Connect to database
psql -U postgres -d pulse_erp_db

# List tables (inside psql)
\dt

# Exit psql
\q
```

---

## 🔍 Troubleshooting

### Backend "Cannot connect to database"
- Check PostgreSQL is running
- Verify `.env` file has correct password
- Test connection: `psql -U postgres -h localhost`

### Frontend "npm start" fails
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

### Port already in use
```powershell
# Find what's using backend port 3002
Get-NetTCPConnection -LocalPort 3002
# Find what's using frontend port 3001
Get-NetTCPConnection -LocalPort 3001

# Or kill all node processes
Get-Process node | Stop-Process -Force
```

### PostgreSQL installation issues
- Make sure Windows is updated
- Run installer as Administrator
- Check Windows Firewall isn't blocking port 5432

---

## 📚 Next Development Steps

### Phase 1: Complete Authentication (1-2 days)
1. Review: `docs/Backend_Implementation_Guide.md`
2. Implement user entity and authentication module
3. Add login/register endpoints
4. Test with Swagger UI

### Phase 2: Multi-Tenant Setup (2-3 days)
1. Review: `docs/PulseControlERP_Security_Tenancy.md`
2. Create tenant guard middleware
3. Add company management endpoints
4. Test tenant isolation

### Phase 3: Core Modules (1-2 weeks per module)
1. Review: `docs/PulseControlERP_Requirements.md`
2. Start with Merchandising module
3. Follow: `IMPLEMENTATION_CHECKLIST.md`
4. Add corresponding frontend screens

---

## 📖 Documentation Resources

All documentation is in the `docs/` folder:

- **Requirements**: `docs/PulseControlERP_Requirements.md` - Full feature specs
- **Workflows**: `docs/PulseControlERP_Workflow.md` - Department processes
- **Backend Guide**: `docs/Backend_Implementation_Guide.md` - NestJS patterns
- **Frontend Guide**: `docs/Frontend_Module_Map.md` - React components
- **Security**: `docs/PulseControlERP_Security_Tenancy.md` - Multi-tenant rules
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md` - 200+ implementation tasks

Visual Diagrams (requires Mermaid viewer):
- **ERD**: `diagrams/ERD.md` - Database relationships
- **Workflows**: `diagrams/Workflow.md` - Department flows
- **Architecture**: `diagrams/Architecture.md` - System design

---

## ✨ Installation Summary

**Completed by Setup**:
- ✅ Backend project structure
- ✅ Frontend project structure  
- ✅ All npm dependencies (backend & frontend)
- ✅ Configuration files (.env, tsconfig.json)
- ✅ Entry points and main app files
- ✅ Material-UI login screen
- ✅ Swagger API documentation setup

**Ready to implement**:
- 50+ API endpoints (see `api/openapi.yaml`)
- 30+ database tables (see `db/schema.sql`)
- 12 department modules (see requirements)
- Multi-tenant architecture
- Complete approval workflows

**Time to first working version**: 4-6 hours (after PostgreSQL installed)

---

**Created**: March 9, 2026  
**Status**: Backend and Frontend installed and configured  
**Next Step**: Install PostgreSQL, create database, start servers

For detailed implementation guide, see `INSTALLATION_COMPLETE.md`
