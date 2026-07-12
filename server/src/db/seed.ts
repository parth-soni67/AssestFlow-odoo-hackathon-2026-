import { PrismaClient, Role, UserStatus, AssetStatus, AllocationStatus, TransferStatus, BookingStatus, Priority, MaintenanceStatus, AuditStatus, AuditResult, User, Asset } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  
  // Set relations to null to prevent foreign key errors during truncation
  await prisma.department.updateMany({ data: { departmentHeadId: null } });
  await prisma.user.updateMany({ data: { departmentId: null } });
  await prisma.asset.updateMany({ data: { currentHolderId: null, currentDepartmentId: null } });

  // Delete all tables in correct dependency order
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Seeding categories...');
  const catLaptops = await prisma.assetCategory.create({
    data: {
      name: 'Laptops & Workstations',
      customFields: { warranty_months: 36, processor_options: ['Intel i7', 'Apple M3'] }
    }
  });

  const catMobiles = await prisma.assetCategory.create({
    data: {
      name: 'Mobile Devices',
      customFields: { screen_size: '6.1 inches', os: 'iOS/Android' }
    }
  });

  const catFurniture = await prisma.assetCategory.create({
    data: {
      name: 'Office Furniture',
      customFields: { material: 'Ergonomic Mesh', color: 'Black' }
    }
  });

  const catNetworking = await prisma.assetCategory.create({
    data: {
      name: 'Networking Equipment',
      customFields: { ports: 24, form_factor: '1U Rackmount' }
    }
  });

  const catVehicles = await prisma.assetCategory.create({
    data: {
      name: 'Vehicles',
      customFields: { fuel: 'Electric', battery_capacity_kwh: 75 }
    }
  });

  console.log('Seeding departments...');
  const deptIT = await prisma.department.create({ data: { name: 'IT Operations' } });
  const deptHR = await prisma.department.create({ data: { name: 'Human Resources' } });
  const deptFac = await prisma.department.create({ data: { name: 'Facilities & Maintenance' } });

  console.log('Seeding users...');
  const saltRounds = 10;
  const defaultHash = await bcrypt.hash('password123', saltRounds);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.Admin,
      status: UserStatus.Active
    }
  });

  // Asset Managers
  const manager = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'manager@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.AssetManager,
      status: UserStatus.Active
    }
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'manager2@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.AssetManager,
      status: UserStatus.Active
    }
  });

  // Department Heads
  const headIT = await prisma.user.create({
    data: {
      name: 'Devin Cole',
      email: 'head@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.DepartmentHead,
      status: UserStatus.Active,
      departmentId: deptIT.id
    }
  });

  const headHR = await prisma.user.create({
    data: {
      name: 'Rachel Green',
      email: 'hrhead@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.DepartmentHead,
      status: UserStatus.Active,
      departmentId: deptHR.id
    }
  });

  const headFac = await prisma.user.create({
    data: {
      name: 'Bob Builder',
      email: 'fachead@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.DepartmentHead,
      status: UserStatus.Active,
      departmentId: deptFac.id
    }
  });

  // Update department heads
  await prisma.department.update({ where: { id: deptIT.id }, data: { departmentHeadId: headIT.id } });
  await prisma.department.update({ where: { id: deptHR.id }, data: { departmentHeadId: headHR.id } });
  await prisma.department.update({ where: { id: deptFac.id }, data: { departmentHeadId: headFac.id } });

  // Regular Employees
  const employee = await prisma.user.create({
    data: {
      name: 'Priya Shah',
      email: 'employee@assetflow.dev',
      passwordHash: defaultHash,
      role: Role.Employee,
      status: UserStatus.Active,
      departmentId: deptIT.id
    }
  });

  const employeesData = [
    { name: 'John Doe', email: 'john.doe@assetflow.dev', deptId: deptIT.id },
    { name: 'Jane Smith', email: 'jane.smith@assetflow.dev', deptId: deptIT.id },
    { name: 'David Lee', email: 'david.lee@assetflow.dev', deptId: deptHR.id },
    { name: 'Alice Johnson', email: 'alice.j@assetflow.dev', deptId: deptHR.id },
    { name: 'Charlie Brown', email: 'charlie@assetflow.dev', deptId: deptFac.id },
    { name: 'Eva Long', email: 'eva.l@assetflow.dev', deptId: deptFac.id },
    { name: 'Frank Castle', email: 'frank.c@assetflow.dev', deptId: deptIT.id },
    { name: 'Grace Hopper', email: 'grace.h@assetflow.dev', deptId: deptIT.id },
  ];

  const employees: User[] = [employee];
  for (const emp of employeesData) {
    const created = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        passwordHash: defaultHash,
        role: Role.Employee,
        status: UserStatus.Active,
        departmentId: emp.deptId
      }
    });
    employees.push(created);
  }

  console.log('Seeding assets...');
  
  // Helper to format tags: AF-0001, AF-0002...
  const formatTag = (num: number) => `AF-${num.toString().padStart(4, '0')}`;

  const assets: Asset[] = [];

  // Laptops (Available & Allocated)
  for (let i = 1; i <= 10; i++) {
    const isAllocated = i <= 4;
    const holder = isAllocated ? employees[i - 1] : null;
    const asset = await prisma.asset.create({
      data: {
        name: `MacBook Pro 16" (L-${i})`,
        categoryId: catLaptops.id,
        assetTag: formatTag(i),
        serialNumber: `SN-LAPTOP-${1000 + i}`,
        acquisitionDate: new Date('2025-01-10'),
        acquisitionCost: 2499.00,
        condition: 'Good',
        location: isAllocated ? 'Remote / Work from Home' : 'IT Storage Locker B',
        isBookable: false,
        status: isAllocated ? AssetStatus.Allocated : AssetStatus.Available,
        currentHolderId: holder?.id || null,
        currentDepartmentId: holder?.departmentId || null
      }
    });
    assets.push(asset);

    if (isAllocated && holder) {
      // Create corresponding active allocation
      await prisma.allocation.create({
        data: {
          assetId: asset.id,
          employeeId: holder.id,
          departmentId: holder.departmentId,
          allocatedDate: new Date('2025-01-15'),
          expectedReturnDate: new Date('2027-01-15'),
          status: AllocationStatus.Active
        }
      });
    }
  }

  // Mobile Devices (Available & Allocated)
  for (let i = 11; i <= 16; i++) {
    const isAllocated = i === 11 || i === 12;
    const holder = isAllocated ? employees[i - 10] : null;
    const asset = await prisma.asset.create({
      data: {
        name: `iPhone 15 Pro Max (M-${i - 10})`,
        categoryId: catMobiles.id,
        assetTag: formatTag(i),
        serialNumber: `SN-MOBILE-${2000 + i}`,
        acquisitionDate: new Date('2025-02-15'),
        acquisitionCost: 1199.00,
        condition: 'New',
        location: isAllocated ? 'Field / On Person' : 'IT Storage Locker A',
        isBookable: false,
        status: isAllocated ? AssetStatus.Allocated : AssetStatus.Available,
        currentHolderId: holder?.id || null,
        currentDepartmentId: holder?.departmentId || null
      }
    });
    assets.push(asset);

    if (isAllocated && holder) {
      await prisma.allocation.create({
        data: {
          assetId: asset.id,
          employeeId: holder.id,
          departmentId: holder.departmentId,
          allocatedDate: new Date('2025-02-20'),
          expectedReturnDate: new Date('2026-02-20'),
          status: AllocationStatus.Active
        }
      });
    }
  }

  // Office Furniture (Available)
  for (let i = 17; i <= 22; i++) {
    const asset = await prisma.asset.create({
      data: {
        name: `Ergonomic Office Chair C-${i - 16}`,
        categoryId: catFurniture.id,
        assetTag: formatTag(i),
        serialNumber: `SN-CHAIR-${3000 + i}`,
        acquisitionDate: new Date('2024-06-01'),
        acquisitionCost: 450.00,
        condition: 'Good',
        location: `HQ Floor ${i % 2 === 0 ? '1' : '2'} - Open Space`,
        isBookable: false,
        status: AssetStatus.Available
      }
    });
    assets.push(asset);
  }

  // Networking Equipment (Available & Under Maintenance)
  for (let i = 23; i <= 26; i++) {
    const isMaintenance = i === 23;
    const asset = await prisma.asset.create({
      data: {
        name: `Cisco Switch 24-Port S-${i - 22}`,
        categoryId: catNetworking.id,
        assetTag: formatTag(i),
        serialNumber: `SN-SWITCH-${4000 + i}`,
        acquisitionDate: new Date('2024-03-15'),
        acquisitionCost: 1800.00,
        condition: isMaintenance ? 'Fair' : 'Excellent',
        location: 'HQ Server Room Rack 2',
        isBookable: false,
        status: isMaintenance ? AssetStatus.UnderMaintenance : AssetStatus.Available
      }
    });
    assets.push(asset);

    if (isMaintenance) {
      // Create maintenance request
      await prisma.maintenanceRequest.create({
        data: {
          assetId: asset.id,
          raisedById: employee.id,
          issueDescription: 'Port 12 and 14 intermittent packet drop. Requires transceiver tests.',
          priority: Priority.High,
          status: MaintenanceStatus.InProgress,
          assignedTechnician: 'TechSupport - NetOperations'
        }
      });
    }
  }

  // Vehicles (Bookable & Available / Reserved / Under Maintenance)
  const vehicle1 = await prisma.asset.create({
    data: {
      name: 'Tesla Model Y - Fleet #1',
      categoryId: catVehicles.id,
      assetTag: formatTag(27),
      serialNumber: `SN-VEHICLE-TESLA1`,
      acquisitionDate: new Date('2024-11-20'),
      acquisitionCost: 48000.00,
      condition: 'Excellent',
      location: 'HQ Parking Lot G1',
      isBookable: true,
      status: AssetStatus.Available
    }
  });
  assets.push(vehicle1);

  const vehicle2 = await prisma.asset.create({
    data: {
      name: 'Tesla Model Y - Fleet #2',
      categoryId: catVehicles.id,
      assetTag: formatTag(28),
      serialNumber: `SN-VEHICLE-TESLA2`,
      acquisitionDate: new Date('2024-11-20'),
      acquisitionCost: 48000.00,
      condition: 'Fair',
      location: 'HQ Parking Lot G2',
      isBookable: true,
      status: AssetStatus.UnderMaintenance
    }
  });
  assets.push(vehicle2);

  await prisma.maintenanceRequest.create({
    data: {
      assetId: vehicle2.id,
      raisedById: headFac.id,
      issueDescription: 'Annual battery coolant check and tire rotation.',
      priority: Priority.Medium,
      status: MaintenanceStatus.InProgress,
      assignedTechnician: 'Tesla Service Center - South'
    }
  });

  // Reserved bookable projector
  const projector = await prisma.asset.create({
    data: {
      name: 'Epson 4K Projector P-1',
      categoryId: catNetworking.id,
      assetTag: formatTag(29),
      serialNumber: `SN-PROJECTOR-1`,
      acquisitionDate: new Date('2025-01-05'),
      acquisitionCost: 899.00,
      condition: 'Good',
      location: 'Main Conference Room Cabinet',
      isBookable: true,
      status: AssetStatus.Reserved
    }
  });
  assets.push(projector);

  // Lost Asset
  const lostAsset = await prisma.asset.create({
    data: {
      name: 'iPad Pro 11" - Travel Kit',
      categoryId: catMobiles.id,
      assetTag: formatTag(30),
      serialNumber: `SN-MOBILE-LOST`,
      acquisitionDate: new Date('2024-08-10'),
      acquisitionCost: 999.00,
      condition: 'Good',
      location: 'Unknown',
      isBookable: false,
      status: AssetStatus.Lost
    }
  });
  assets.push(lostAsset);

  console.log('Seeding sample bookings...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.setHours(9, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(11, 0, 0, 0));

  await prisma.booking.create({
    data: {
      resourceAssetId: vehicle1.id,
      bookedById: employee.id,
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      status: BookingStatus.Upcoming
    }
  });

  await prisma.booking.create({
    data: {
      resourceAssetId: projector.id,
      bookedById: headHR.id,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2 hours
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: BookingStatus.Upcoming
    }
  });

  console.log('Seeding sample audit cycle...');
  const auditStart = new Date();
  auditStart.setDate(auditStart.getDate() - 5);
  const auditEnd = new Date();
  auditEnd.setDate(auditEnd.getDate() + 5);

  const auditCycle = await prisma.auditCycle.create({
    data: {
      name: 'Q3 IT Hardware Audit',
      scopeDepartmentId: deptIT.id,
      location: 'HQ Floor 1 & Remote',
      dateRangeStart: auditStart,
      dateRangeEnd: auditEnd,
      status: AuditStatus.Open,
      assignedAuditors: JSON.stringify([admin.id])
    }
  });

  // Mark audit items
  await prisma.auditItem.create({
    data: {
      auditCycleId: auditCycle.id,
      assetId: assets[0].id, // Laptop 1
      result: AuditResult.Verified,
      notes: 'Verified physically in office. No issues.',
      auditorId: admin.id
    }
  });

  await prisma.auditItem.create({
    data: {
      auditCycleId: auditCycle.id,
      assetId: assets[2].id, // Laptop 3
      result: AuditResult.Damaged,
      notes: 'Screen crack on bottom corner. Still functional but needs review.',
      auditorId: admin.id
    }
  });

  console.log('Seeding transfer requests...');
  await prisma.transferRequest.create({
    data: {
      assetId: assets[0].id, // MacBook Pro 16" (L-1), currently held by Priya (employee)
      fromHolderId: employee.id,
      toHolderId: headIT.id,
      status: TransferStatus.Requested,
      requestedById: headIT.id
    }
  });

  console.log('Seeding notifications...');
  await prisma.notification.create({
    data: {
      userId: employee.id,
      type: 'ALLOCATION_OVERDUE',
      message: 'Your allocated device MacBook Pro 16" (AF-0001) is approaching expected return.'
    }
  });

  console.log('Seeding activity logs...');
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      entityType: 'System',
      entityId: 0,
      details: { message: 'Database populated with initial demo dataset.' }
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
