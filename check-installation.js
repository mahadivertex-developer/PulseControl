#!/usr/bin/env node

/**
 * PulseControlERP Installation Status Check
 * Verifies all installed components and provides setup guidance
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

class InstallationStatus {
  constructor() {
    this.checks = [];
  }

  checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    this.checks.push({
      name: description,
      status: exists ? '✅' : '❌',
      path: filePath,
      exists,
    });
    return exists;
  }

  checkDirectory(dirPath, description) {
    const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    this.checks.push({
      name: description,
      status: exists ? '✅' : '❌',
      path: dirPath,
      exists,
    });
    return exists;
  }

  checkCommand(command, description) {
    const { execSync } = require('child_process');
    try {
      execSync(`${command} --version`, { stdio: 'ignore' });
      this.checks.push({
        name: description,
        status: '✅',
        command,
        exists: true,
      });
      return true;
    } catch (e) {
      this.checks.push({
        name: description,
        status: '⚠️',
        command,
        exists: false,
      });
      return false;
    }
  }

  print() {
    console.log('\n' + '='.repeat(60));
    console.log('  PulseControlERP - Installation Status');
    console.log('='.repeat(60) + '\n');

    // Group checks by type
    console.log('📦 Backend Setup:');
    this.checks
      .filter((c) => c.path && c.path.includes('backend'))
      .forEach((c) => console.log(`  ${c.status} ${c.name}`));

    console.log('\n🎨 Frontend Setup:');
    this.checks
      .filter((c) => c.path && c.path.includes('frontend'))
      .forEach((c) => console.log(`  ${c.status} ${c.name}`));

    console.log('\n🗄️  Database:');
    this.checks
      .filter((c) => c.name.includes('PostgreSQL'))
      .forEach((c) => console.log(`  ${c.status} ${c.name}`));

    console.log('\n📝 Documentation:');
    this.checks
      .filter((c) => c.path && c.path.includes('docs'))
      .forEach((c) => console.log(`  ${c.status} ${c.name}`));

    console.log('\n' + '='.repeat(60));
    console.log('✅ = Installed & Ready');
    console.log('⚠️  = Missing or Setup Required');
    console.log('❌ = Not Found\n');
  }
}

// Run checks
const status = new InstallationStatus();

// Backend
status.checkDirectory(`${projectRoot}/backend`, 'Backend Directory');
status.checkFile(`${projectRoot}/backend/package.json`, 'Backend package.json');
status.checkFile(`${projectRoot}/backend/.env`, 'Backend .env Configuration');
status.checkFile(`${projectRoot}/backend/src/main.ts`, 'Backend Entry Point');
status.checkDirectory(`${projectRoot}/backend/node_modules`, 'Backend Dependencies (node_modules)');

// Frontend
status.checkDirectory(`${projectRoot}/frontend`, 'Frontend Directory');
status.checkFile(`${projectRoot}/frontend/package.json`, 'Frontend package.json');
status.checkFile(`${projectRoot}/frontend/.env`, 'Frontend .env Configuration');
status.checkFile(`${projectRoot}/frontend/src/App.tsx`, 'Frontend React App');
status.checkDirectory(`${projectRoot}/frontend/node_modules`, 'Frontend Dependencies (node_modules)');

// Documentation
status.checkFile(`${projectRoot}/docs/PulseControlERP_Requirements.md`, 'Requirements Documentation');
status.checkFile(`${projectRoot}/docs/Backend_Implementation_Guide.md`, 'Backend Guide');
status.checkFile(`${projectRoot}/docs/Frontend_Module_Map.md`, 'Frontend Guide');

// Commands
status.checkCommand('node', 'Node.js');
status.checkCommand('npm', 'NPM');
status.checkCommand('psql', 'PostgreSQL CLI');

// Print results
status.print();

// Next steps
console.log('📋 NEXT STEPS:\n');
console.log('1️⃣  Install PostgreSQL (if not already installed)');
console.log('   Download: https://www.postgresql.org/download/\n');

console.log('2️⃣  Create Database:');
console.log('   createdb pulse_erp_db\n');

console.log('3️⃣  Start Backend:');
console.log('   cd backend && npm run start:dev\n');

console.log('4️⃣  Start Frontend (in another terminal):');
console.log('   cd frontend && npm start\n');

console.log('5️⃣  Access Application:');
console.log('   Browser:  http://localhost:3001');
console.log('   API Docs: http://localhost:3002/api/docs\n');

console.log('📖 For more details, see: INSTALLATION_COMPLETE.md\n');
