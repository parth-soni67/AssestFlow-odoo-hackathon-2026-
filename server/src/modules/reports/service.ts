import { prisma } from '../../lib/prisma';
import { BookingStatus, MaintenanceStatus, Priority, AssetStatus } from '@prisma/client';

export const getAssetUtilizationReport = async () => {
  // 1. Fetch assets, allocations, and bookings
  const [assets, allocations, bookings] = await Promise.all([
    prisma.asset.findMany({
      include: {
        category: { select: { id: true, name: true } }
      }
    }),
    prisma.allocation.findMany(),
    prisma.booking.findMany({
      where: {
        status: { not: BookingStatus.Cancelled }
      }
    })
  ]);

  const now = new Date();

  // 2. Map allocations and bookings by assetId for O(N) grouping
  const allocationsByAsset = new Map<number, typeof allocations>();
  for (const alloc of allocations) {
    if (!allocationsByAsset.has(alloc.assetId)) {
      allocationsByAsset.set(alloc.assetId, []);
    }
    allocationsByAsset.get(alloc.assetId)!.push(alloc);
  }

  const bookingsByAsset = new Map<number, typeof bookings>();
  for (const booking of bookings) {
    if (!bookingsByAsset.has(booking.resourceAssetId)) {
      bookingsByAsset.set(booking.resourceAssetId, []);
    }
    bookingsByAsset.get(booking.resourceAssetId)!.push(booking);
  }

  // 3. Compute utilization hours per asset
  const reportData = assets.map((asset) => {
    let allocationHours = 0;
    let allocationsCount = 0;

    const assetAllocations = allocationsByAsset.get(asset.id) || [];
    for (const alloc of assetAllocations) {
      const start = new Date(alloc.allocatedDate);
      const end = alloc.actualReturnDate ? new Date(alloc.actualReturnDate) : now;
      allocationHours += Math.max(0, (end.getTime() - start.getTime()) / 3600000);
      allocationsCount++;
    }

    let bookingHours = 0;
    let bookingsCount = 0;

    const assetBookings = bookingsByAsset.get(asset.id) || [];
    for (const booking of assetBookings) {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      bookingHours += Math.max(0, (end.getTime() - start.getTime()) / 3600000);
      bookingsCount++;
    }

    const totalHours = parseFloat((allocationHours + bookingHours).toFixed(1));

    return {
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      categoryName: asset.category?.name || 'Uncategorized',
      status: asset.status,
      allocationsCount,
      bookingsCount,
      utilizationHours: totalHours
    };
  });

  // 4. Sort and classify
  const sortedReport = [...reportData].sort((a, b) => b.utilizationHours - a.utilizationHours);

  const mostUsed = sortedReport.filter(a => a.utilizationHours > 0).slice(0, 5);
  const idle = sortedReport.filter(a => a.utilizationHours === 0).slice(0, 10);

  // Fallback: if there are not enough idle assets, pad with lowest utilization
  if (idle.length < 5) {
    const bottomAssets = [...sortedReport].reverse().slice(0, 10);
    for (const asset of bottomAssets) {
      if (!idle.find(a => a.id === asset.id) && idle.length < 10) {
        idle.push(asset);
      }
    }
  }

  // 5. Compute summary stats
  const totalAssetsCount = assets.length;
  const totalHoursSum = parseFloat(reportData.reduce((acc, curr) => acc + curr.utilizationHours, 0).toFixed(1));
  const avgHours = totalAssetsCount > 0 ? parseFloat((totalHoursSum / totalAssetsCount).toFixed(1)) : 0;

  // Most used category
  const categoryHours: { [key: string]: number } = {};
  for (const item of reportData) {
    categoryHours[item.categoryName] = (categoryHours[item.categoryName] || 0) + item.utilizationHours;
  }
  let topCategory = 'None';
  let maxCatHours = 0;
  for (const cat of Object.keys(categoryHours)) {
    if (categoryHours[cat] > maxCatHours) {
      maxCatHours = categoryHours[cat];
      topCategory = cat;
    }
  }

  return {
    summary: {
      totalAssets: totalAssetsCount,
      totalUtilizationHours: totalHoursSum,
      averageUtilizationHours: avgHours,
      topCategory: maxCatHours > 0 ? `${topCategory} (${maxCatHours.toFixed(1)} hrs)` : 'None'
    },
    mostUsed,
    idle,
    all: sortedReport
  };
};

export const getAssetMaintenanceReport = async () => {
  // 1. Fetch all assets, categories, and maintenance requests
  const [assets, categories, requests] = await Promise.all([
    prisma.asset.findMany({
      include: {
        category: { select: { id: true, name: true } }
      }
    }),
    prisma.assetCategory.findMany(),
    prisma.maintenanceRequest.findMany()
  ]);

  // 2. Group requests by assetId and categoryId
  const requestsByAsset = new Map<number, typeof requests>();
  const requestsByCategory = new Map<number, typeof requests>();

  // Map asset category lookup
  const assetCategoryMap = new Map<number, number>(); // assetId -> categoryId
  for (const asset of assets) {
    assetCategoryMap.set(asset.id, asset.categoryId);
  }

  for (const req of requests) {
    // Group by asset
    if (!requestsByAsset.has(req.assetId)) {
      requestsByAsset.set(req.assetId, []);
    }
    requestsByAsset.get(req.assetId)!.push(req);

    // Group by category
    const catId = assetCategoryMap.get(req.assetId);
    if (catId !== undefined) {
      if (!requestsByCategory.has(catId)) {
        requestsByCategory.set(catId, []);
      }
      requestsByCategory.get(catId)!.push(req);
    }
  }

  // 3. Compute status and priority summaries
  const statusSummary = {
    [MaintenanceStatus.Pending]: 0,
    [MaintenanceStatus.Approved]: 0,
    [MaintenanceStatus.TechnicianAssigned]: 0,
    [MaintenanceStatus.InProgress]: 0,
    [MaintenanceStatus.Resolved]: 0,
    [MaintenanceStatus.Rejected]: 0
  };

  const prioritySummary = {
    [Priority.Low]: 0,
    [Priority.Medium]: 0,
    [Priority.High]: 0,
    [Priority.Critical]: 0
  };

  for (const req of requests) {
    statusSummary[req.status] = (statusSummary[req.status] || 0) + 1;
    prioritySummary[req.priority] = (prioritySummary[req.priority] || 0) + 1;
  }

  // 4. Map frequency calculations for assets
  const byAsset = assets.map((asset) => {
    const assetRequests = requestsByAsset.get(asset.id) || [];
    
    return {
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      categoryName: asset.category?.name || 'Uncategorized',
      totalCount: assetRequests.length,
      pendingCount: assetRequests.filter(r => r.status === MaintenanceStatus.Pending).length,
      inProgressCount: assetRequests.filter(r => r.status === MaintenanceStatus.InProgress).length,
      resolvedCount: assetRequests.filter(r => r.status === MaintenanceStatus.Resolved).length,
      rejectedCount: assetRequests.filter(r => r.status === MaintenanceStatus.Rejected).length
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  // 5. Map frequency calculations for categories
  const byCategory = categories.map((cat) => {
    const catRequests = requestsByCategory.get(cat.id) || [];

    return {
      id: cat.id,
      name: cat.name,
      totalCount: catRequests.length,
      pendingCount: catRequests.filter(r => r.status === MaintenanceStatus.Pending).length,
      inProgressCount: catRequests.filter(r => r.status === MaintenanceStatus.InProgress).length,
      resolvedCount: catRequests.filter(r => r.status === MaintenanceStatus.Resolved).length,
      rejectedCount: catRequests.filter(r => r.status === MaintenanceStatus.Rejected).length
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  return {
    summary: {
      totalRequests: requests.length,
      byStatus: statusSummary,
      byPriority: prioritySummary
    },
    byAsset,
    byCategory
  };
};

export const getAssetSchedulesReport = async () => {
  // 1. Fetch all assets, categories, and maintenance requests
  const [assets, requests] = await Promise.all([
    prisma.asset.findMany({
      include: {
        category: { select: { id: true, name: true, customFields: true } }
      }
    }),
    prisma.maintenanceRequest.findMany()
  ]);

  const now = new Date();

  // 2. Identify resolved and active maintenance requests per asset
  const resolvedRequestsByAsset = new Map<number, typeof requests>();
  const activeRequestsByAsset = new Map<number, typeof requests>();

  for (const req of requests) {
    if (req.status === MaintenanceStatus.Resolved) {
      if (!resolvedRequestsByAsset.has(req.assetId)) {
        resolvedRequestsByAsset.set(req.assetId, []);
      }
      resolvedRequestsByAsset.get(req.assetId)!.push(req);
    } else if (req.status !== MaintenanceStatus.Rejected) {
      if (!activeRequestsByAsset.has(req.assetId)) {
        activeRequestsByAsset.set(req.assetId, []);
      }
      activeRequestsByAsset.get(req.assetId)!.push(req);
    }
  }

  // 3. Process each asset for schedules
  const dueForMaintenance: any[] = [];
  const dueForRetirement: any[] = [];
  let retiredCount = 0;

  for (const asset of assets) {
    if (asset.status === AssetStatus.Retired) {
      retiredCount++;
      continue;
    }

    // A. RETIREMENT CHECK
    // Calculate age in months
    const ageMonths = parseFloat(
      ((now.getTime() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1)
    );

    // Retrieve useful life (read category custom fields if set, otherwise default by string)
    let usefulLifeMonths = 36; // fallback 3 years
    const customFieldsObj = asset.category?.customFields as any;
    if (customFieldsObj && typeof customFieldsObj === 'object') {
      if (typeof customFieldsObj.usefulLifeMonths === 'number') {
        usefulLifeMonths = customFieldsObj.usefulLifeMonths;
      } else if (typeof customFieldsObj.usefulLifeMonths === 'string') {
        usefulLifeMonths = parseInt(customFieldsObj.usefulLifeMonths, 10) || 36;
      }
    } else {
      const name = (asset.category?.name || '').toLowerCase();
      if (name.includes('laptop') || name.includes('workstation') || name.includes('computer')) {
        usefulLifeMonths = 36;
      } else if (name.includes('mobile') || name.includes('phone') || name.includes('tablet')) {
        usefulLifeMonths = 24;
      } else if (name.includes('furniture') || name.includes('desk') || name.includes('chair')) {
        usefulLifeMonths = 60;
      } else if (name.includes('network') || name.includes('server') || name.includes('switch') || name.includes('router')) {
        usefulLifeMonths = 48;
      }
    }

    const remainingMonths = parseFloat((usefulLifeMonths - ageMonths).toFixed(1));

    const isExceededLife = remainingMonths <= 0;
    const isBadCondition = asset.condition === 'Poor' || asset.condition === 'Damaged';

    if ((isExceededLife || isBadCondition) && asset.status !== AssetStatus.Lost) {
      dueForRetirement.push({
        id: asset.id,
        name: asset.name,
        assetTag: asset.assetTag,
        categoryName: asset.category?.name || 'Uncategorized',
        acquisitionDate: asset.acquisitionDate,
        ageMonths,
        usefulLifeMonths,
        remainingMonths,
        condition: asset.condition,
        reason: isExceededLife 
          ? `Useful life exceeded (${ageMonths}m age vs ${usefulLifeMonths}m life)`
          : `Asset condition is ${asset.condition}`
      });
    }

    // B. MAINTENANCE CHECK
    // Determine last maintenance inspection date
    const assetResolved = resolvedRequestsByAsset.get(asset.id) || [];
    let lastMaintDate = new Date(asset.acquisitionDate);
    let isNeverMaintained = true;

    if (assetResolved.length > 0) {
      assetResolved.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      lastMaintDate = new Date(assetResolved[0].updatedAt);
      isNeverMaintained = false;
    }

    const elapsedMonths = parseFloat(
      ((now.getTime() - lastMaintDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1)
    );

    const assetActive = activeRequestsByAsset.get(asset.id) || [];
    const hasActiveTickets = assetActive.length > 0;

    const isMaintDue = (elapsedMonths >= 6 || hasActiveTickets) &&
      asset.status !== AssetStatus.Lost &&
      asset.status !== AssetStatus.UnderMaintenance;

    if (isMaintDue) {
      dueForMaintenance.push({
        id: asset.id,
        name: asset.name,
        assetTag: asset.assetTag,
        categoryName: asset.category?.name || 'Uncategorized',
        lastMaintenanceDate: isNeverMaintained ? null : lastMaintDate,
        elapsedMonths,
        condition: asset.condition,
        reason: hasActiveTickets 
          ? `Outstanding active ticket: ${assetActive[0].issueDescription}`
          : `${elapsedMonths}m since last verification check`
      });
    }
  }

  return {
    summary: {
      totalDueForMaintenance: dueForMaintenance.length,
      totalDueForRetirement: dueForRetirement.length,
      totalRetired: retiredCount
    },
    dueForMaintenance,
    dueForRetirement
  };
};

export const getDepartmentAllocationsReport = async () => {
  // 1. Fetch all departments and assets
  const [departments, assets] = await Promise.all([
    prisma.department.findMany({
      include: {
        departmentHead: { select: { id: true, name: true } }
      }
    }),
    prisma.asset.findMany({
      include: {
        category: { select: { id: true, name: true } }
      }
    })
  ]);

  // 2. Group assets by currentDepartmentId
  const assetsByDept = new Map<number, typeof assets>();
  for (const asset of assets) {
    if (asset.currentDepartmentId) {
      if (!assetsByDept.has(asset.currentDepartmentId)) {
        assetsByDept.set(asset.currentDepartmentId, []);
      }
      assetsByDept.get(asset.currentDepartmentId)!.push(asset);
    }
  }

  // 3. Map aggregates per department
  let totalAllocatedAssets = 0;
  let totalAllocatedValue = 0;

  const departmentsReport = departments.map((dept) => {
    const deptAssets = assetsByDept.get(dept.id) || [];
    const assetCount = deptAssets.length;

    const totalValue = parseFloat(
      deptAssets.reduce((acc, curr) => acc + Number(curr.acquisitionCost), 0).toFixed(2)
    );

    // Group categories
    const categoriesMap: { [key: string]: number } = {};
    for (const asset of deptAssets) {
      const catName = asset.category?.name || 'Uncategorized';
      categoriesMap[catName] = (categoriesMap[catName] || 0) + 1;
    }

    const categoryBreakdown = Object.keys(categoriesMap).map((catName) => ({
      categoryName: catName,
      count: categoriesMap[catName]
    })).sort((a, b) => b.count - a.count);

    totalAllocatedAssets += assetCount;
    totalAllocatedValue += totalValue;

    return {
      id: dept.id,
      name: dept.name,
      headName: dept.departmentHead?.name || 'No assigned Head',
      assetCount,
      totalValue,
      categoryBreakdown
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  return {
    summary: {
      totalAllocatedAssets,
      totalDepartmentsCount: departments.length,
      totalAllocatedValue: parseFloat(totalAllocatedValue.toFixed(2))
    },
    departments: departmentsReport
  };
};

export const getBookingHeatmapReport = async () => {
  // 1. Fetch bookings
  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: BookingStatus.Cancelled }
    }
  });

  // 2. Setup hours bins map (key: `${day}-${hour}`)
  const bins = new Map<string, number>();

  for (const booking of bookings) {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    let current = new Date(start);
    // Fill bins hour by hour
    while (current < end) {
      const d = current.getDay(); // 0-6 (0 is Sunday, 1 is Monday, etc.)
      const h = current.getHours(); // 0-23
      const key = `${d}-${h}`;
      bins.set(key, (bins.get(key) || 0) + 1);

      // Increment by 1 hour
      current.setHours(current.getHours() + 1);
    }
  }

  // 3. Compute summaries (peak day, peak hour)
  const dayCounts = Array(7).fill(0);
  const hourCounts = Array(24).fill(0);

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const count = bins.get(`${d}-${h}`) || 0;
      dayCounts[d] += count;
      hourCounts[h] += count;
    }
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let peakDayIndex = 1; // default Monday
  let maxDayCount = 0;
  for (let d = 0; d < 7; d++) {
    if (dayCounts[d] > maxDayCount) {
      maxDayCount = dayCounts[d];
      peakDayIndex = d;
    }
  }

  let peakHourValue = 9; // default 09:00
  let maxHourCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > maxHourCount) {
      maxHourCount = hourCounts[h];
      peakHourValue = h;
    }
  }

  // 4. Build coordinate list
  const heatmap = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const count = bins.get(`${d}-${h}`) || 0;
      heatmap.push({ day: d, hour: h, count });
    }
  }

  const padHour = (num: number) => num.toString().padStart(2, '0');

  return {
    summary: {
      totalBookings: bookings.length,
      peakDay: maxDayCount > 0 ? daysOfWeek[peakDayIndex] : 'None',
      peakHour: maxHourCount > 0 ? `${padHour(peakHourValue)}:00 - ${padHour(peakHourValue + 1)}:00` : 'None'
    },
    heatmap
  };
};
