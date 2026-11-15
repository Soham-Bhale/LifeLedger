import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_SERVICES,
  resolveActiveRole,
  canRolePerformAction,
  computeColdIschemiaMetrics,
  evaluateThermalSafety,
  partitionOrgansForRole,
  type OrganRecord,
} from './roleWorkflow';

test('defines all 6 distinct role services in sequential order', () => {
  assert.equal(ROLE_SERVICES.length, 6);
  assert.deepEqual(
    ROLE_SERVICES.map((s) => s.role),
    ['opo', 'logistics', 'authority', 'hospital', 'admin', 'customer']
  );
  assert.deepEqual(
    ROLE_SERVICES.map((s) => s.tabNumber),
    [1, 2, 3, 4, 5, 6]
  );
});

test('resolveActiveRole prioritizes URL query parameter for multi-tab isolation', () => {
  assert.equal(resolveActiveRole('?role=logistics', 'opo'), 'logistics');
  assert.equal(resolveActiveRole('?role=hospital', 'admin'), 'hospital');
  assert.equal(resolveActiveRole('?role=customer', null), 'customer');
  assert.equal(resolveActiveRole('', 'authority'), 'authority');
  assert.equal(resolveActiveRole('', null), 'opo');
});

test('enforces strict UI action isolation with zero cross-service leakage', () => {
  // OPO can harvest and dispatch, but cannot implant or quarantine
  assert.equal(canRolePerformAction('opo', 'harvest_organ'), true);
  assert.equal(canRolePerformAction('opo', 'dispatch_to_logistics'), true);
  assert.equal(canRolePerformAction('opo', 'complete_transplant'), false);
  assert.equal(canRolePerformAction('opo', 'quarantine_organ'), false);

  // Logistics can log telemetry and hand off, but cannot harvest or implant
  assert.equal(canRolePerformAction('logistics', 'log_telemetry'), true);
  assert.equal(canRolePerformAction('logistics', 'handoff_to_authority'), true);
  assert.equal(canRolePerformAction('logistics', 'harvest_organ'), false);
  assert.equal(canRolePerformAction('logistics', 'complete_transplant'), false);

  // Authority can approve allocation, but cannot harvest or implant
  assert.equal(canRolePerformAction('authority', 'approve_allocation'), true);
  assert.equal(canRolePerformAction('authority', 'harvest_organ'), false);
  assert.equal(canRolePerformAction('authority', 'complete_transplant'), false);

  // Hospital can complete transplant, but cannot harvest or quarantine
  assert.equal(canRolePerformAction('hospital', 'complete_transplant'), true);
  assert.equal(canRolePerformAction('hospital', 'harvest_organ'), false);
  assert.equal(canRolePerformAction('hospital', 'quarantine_organ'), false);

  // Admin can quarantine and manage investigations, but does not run clinical surgery
  assert.equal(canRolePerformAction('admin', 'quarantine_organ'), true);
  assert.equal(canRolePerformAction('admin', 'manage_investigations'), true);
  assert.equal(canRolePerformAction('admin', 'complete_transplant'), false);
});

test('computeColdIschemiaMetrics calculates remaining hours and expiration accurately', () => {
  const now = 1700000000000;
  const fourHoursAgo = new Date(now - 4 * 3600 * 1000).toISOString();
  const metrics = computeColdIschemiaMetrics(fourHoursAgo, 24, now, 'Harvested');
  assert.equal(metrics.elapsedHours, 4);
  assert.equal(metrics.remainingHours, 20);
  assert.equal(metrics.isExpired, false);

  const thirtyHoursAgo = new Date(now - 30 * 3600 * 1000).toISOString();
  const breached = computeColdIschemiaMetrics(thirtyHoursAgo, 24, now, 'InTransit');
  assert.equal(breached.remainingHours, 0);
  assert.equal(breached.isExpired, true);
});

test('evaluateThermalSafety flags thermal excursions above 6.0C', () => {
  assert.equal(evaluateThermalSafety(2.8).status, 'OPTIMAL');
  assert.equal(evaluateThermalSafety(5.2).status, 'DRIFT');
  assert.equal(evaluateThermalSafety(8.5).status, 'EXCURSION');
});

test('partitionOrgansForRole isolates active queue per service role', () => {
  const sampleOrgans: OrganRecord[] = [
    {
      organId: 'ORG-1',
      organType: 'Kidney',
      donorId: 'D1',
      donorBloodType: 'O+',
      hlaMarker: '6/6',
      harvestTimestamp: new Date().toISOString(),
      ischemicLimitHours: 24,
      preservationProtocol: 'UW',
      temperatureCelsius: 2.8,
      recipientId: 'R1',
      recipientHospital: 'Apollo',
      currentOwner: '0x1',
      currentOwnerName: 'OPO',
      currentOwnerRole: 'opo',
      stage: 'Harvested',
      isQuarantined: false,
      history: [],
    },
    {
      organId: 'ORG-2',
      organType: 'Heart',
      donorId: 'D2',
      donorBloodType: 'A+',
      hlaMarker: '5/6',
      harvestTimestamp: new Date().toISOString(),
      ischemicLimitHours: 4,
      preservationProtocol: 'HTK',
      temperatureCelsius: 3.1,
      recipientId: 'R2',
      recipientHospital: 'Apollo',
      currentOwner: '0x2',
      currentOwnerName: 'AeroMed',
      currentOwnerRole: 'logistics',
      stage: 'InTransit',
      isQuarantined: false,
      history: [],
    },
    {
      organId: 'ORG-3',
      organType: 'Liver',
      donorId: 'D3',
      donorBloodType: 'B+',
      hlaMarker: '6/6',
      harvestTimestamp: new Date().toISOString(),
      ischemicLimitHours: 12,
      preservationProtocol: 'UW',
      temperatureCelsius: 2.6,
      recipientId: 'R3',
      recipientHospital: 'Apollo',
      currentOwner: '0x4',
      currentOwnerName: 'Apollo',
      currentOwnerRole: 'hospital',
      stage: 'HospitalReceived',
      isQuarantined: false,
      history: [],
    },
  ];

  const opoView = partitionOrgansForRole('opo', sampleOrgans);
  assert.equal(opoView.primaryQueue.length, 1);
  assert.equal(opoView.primaryQueue[0].organId, 'ORG-1');

  const logisticsView = partitionOrgansForRole('logistics', sampleOrgans);
  assert.equal(logisticsView.primaryQueue.length, 1);
  assert.equal(logisticsView.primaryQueue[0].organId, 'ORG-2');

  const hospitalView = partitionOrgansForRole('hospital', sampleOrgans);
  assert.equal(hospitalView.primaryQueue.length, 1);
  assert.equal(hospitalView.primaryQueue[0].organId, 'ORG-3');
});
