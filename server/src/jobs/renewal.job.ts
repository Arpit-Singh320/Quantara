/**
 * Renewal Jobs
 * Auto-creates renewals for expiring policies and manages workflow tasks
 */

import { PrismaClient, PolicyType, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

// Default task templates for renewal workflow
const DEFAULT_TASK_TEMPLATES = [
  { name: 'Request updated exposures', description: 'Collect revenue, payroll, locations, fleet info', category: 'DATA_COLLECTION', daysBeforeDue: 90, priority: 'HIGH', order: 1 },
  { name: 'Request loss runs', description: 'Get 5-year claims history from current carrier', category: 'DATA_COLLECTION', daysBeforeDue: 85, priority: 'HIGH', order: 2 },
  { name: 'Review policy for coverage gaps', description: 'Analyze current coverage vs exposures', category: 'DATA_COLLECTION', daysBeforeDue: 80, priority: 'MEDIUM', order: 3 },
  { name: 'Prepare submission', description: 'Create marketing submission for carriers', category: 'MARKETING', daysBeforeDue: 75, priority: 'HIGH', order: 4 },
  { name: 'Send to markets', description: 'Submit to 3-5 carriers for quotes', category: 'MARKETING', daysBeforeDue: 70, priority: 'HIGH', order: 5 },
  { name: 'Follow up on quotes', description: 'Check status with underwriters', category: 'QUOTE_FOLLOW_UP', daysBeforeDue: 55, priority: 'MEDIUM', order: 6 },
  { name: 'Compare quotes received', description: 'Analyze coverage and pricing differences', category: 'QUOTE_FOLLOW_UP', daysBeforeDue: 45, priority: 'HIGH', order: 7 },
  { name: 'Prepare proposal', description: 'Create client-facing renewal proposal', category: 'PROPOSAL', daysBeforeDue: 35, priority: 'HIGH', order: 8 },
  { name: 'Schedule renewal meeting', description: 'Present options to client', category: 'CLIENT_COMMUNICATION', daysBeforeDue: 30, priority: 'HIGH', order: 9 },
  { name: 'Get client decision', description: 'Confirm selected carrier and coverage', category: 'CLIENT_COMMUNICATION', daysBeforeDue: 20, priority: 'URGENT', order: 10 },
  { name: 'Bind coverage', description: 'Request binder from selected carrier', category: 'BINDING', daysBeforeDue: 14, priority: 'URGENT', order: 11 },
  { name: 'Issue certificates', description: 'Generate COIs for certificate holders', category: 'POST_BIND', daysBeforeDue: 7, priority: 'HIGH', order: 12 },
  { name: 'Deliver policy documents', description: 'Send final policy to client', category: 'POST_BIND', daysBeforeDue: 0, priority: 'MEDIUM', order: 13 },
];

/**
 * Calculate risk score based on policy and client factors
 */
function calculateRiskScore(policy: any, daysUntilExpiry: number): RiskLevel {
  let riskPoints = 0;

  // Time-based risk
  if (daysUntilExpiry <= 14) riskPoints += 40;
  else if (daysUntilExpiry <= 30) riskPoints += 25;
  else if (daysUntilExpiry <= 45) riskPoints += 10;

  // Premium size risk (larger = higher risk if missed)
  const premium = Number(policy.premium);
  if (premium >= 100000) riskPoints += 20;
  else if (premium >= 50000) riskPoints += 10;
  else if (premium >= 25000) riskPoints += 5;

  // Policy type risk
  const highRiskTypes: PolicyType[] = ['CYBER_LIABILITY', 'DIRECTORS_OFFICERS', 'PROFESSIONAL_LIABILITY'];
  if (highRiskTypes.includes(policy.type)) riskPoints += 15;

  // Convert points to level
  if (riskPoints >= 50) return 'HIGH';
  if (riskPoints >= 25) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate risk factors based on policy analysis
 */
function generateRiskFactors(policy: any, daysUntilExpiry: number): string[] {
  const factors: string[] = [];

  if (daysUntilExpiry <= 14) {
    factors.push('Critical: Less than 2 weeks until expiration');
  } else if (daysUntilExpiry <= 30) {
    factors.push('Urgent: Less than 30 days until expiration');
  }

  const premium = Number(policy.premium);
  if (premium >= 100000) {
    factors.push('Large account: Premium exceeds $100,000');
  }

  const highRiskTypes: PolicyType[] = ['CYBER_LIABILITY', 'DIRECTORS_OFFICERS', 'PROFESSIONAL_LIABILITY'];
  if (highRiskTypes.includes(policy.type)) {
    factors.push('Complex coverage type requiring specialized markets');
  }

  if (factors.length === 0) {
    factors.push('Standard renewal - no elevated risk factors');
  }

  return factors;
}

/**
 * Create workflow tasks for a renewal based on templates
 */
async function createWorkflowTasks(renewalId: string, dueDate: Date, policyType: PolicyType): Promise<void> {
  // Check for custom templates for this policy type
  const customTemplates = await prisma.taskTemplate.findMany({
    where: {
      OR: [
        { policyType: policyType },
        { policyType: null }, // System-wide templates
      ],
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });

  const templates = customTemplates.length > 0 ? customTemplates : DEFAULT_TASK_TEMPLATES;

  const tasks = templates.map((template: any) => {
    const taskDueDate = new Date(dueDate);
    taskDueDate.setDate(taskDueDate.getDate() - (template.daysBeforeDue || 0));

    return {
      renewalId,
      name: template.name,
      description: template.description || null,
      dueDate: taskDueDate,
      status: 'PENDING' as const,
      priority: (template.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      category: (template.category || 'OTHER') as any,
      order: template.order || 0,
    };
  });

  await prisma.task.createMany({
    data: tasks,
  });

  console.log(`[Renewal Job] Created ${tasks.length} tasks for renewal ${renewalId}`);
}

/**
 * Create renewals for policies expiring within the specified window
 */
export async function createRenewalsForExpiringPolicies(daysAhead: number = 90): Promise<{
  created: number;
  skipped: number;
  errors: string[];
}> {
  const result = { created: 0, skipped: 0, errors: [] as string[] };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  try {
    // Find active policies expiring within the window that don't have active renewals
    const policies = await prisma.policy.findMany({
      where: {
        expirationDate: { lte: cutoffDate },
        status: 'ACTIVE',
        renewals: {
          none: {
            status: { in: ['PENDING', 'IN_PROGRESS', 'QUOTED'] },
          },
        },
      },
      include: {
        client: true,
      },
    });

    console.log(`[Renewal Job] Found ${policies.length} policies needing renewals`);

    for (const policy of policies) {
      try {
        const daysUntilExpiry = Math.ceil(
          (policy.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const riskScore = calculateRiskScore(policy, daysUntilExpiry);
        const riskFactors = generateRiskFactors(policy, daysUntilExpiry);

        // Create the renewal
        const renewal = await prisma.renewal.create({
          data: {
            userId: policy.userId,
            clientId: policy.clientId,
            policyId: policy.id,
            dueDate: policy.expirationDate,
            status: 'PENDING',
            riskScore,
            riskFactors,
            aiInsights: [
              `Policy expires in ${daysUntilExpiry} days`,
              `Current premium: $${Number(policy.premium).toLocaleString()}`,
              `Coverage with ${policy.carrier}`,
            ],
          },
        });

        // Create workflow tasks
        await createWorkflowTasks(renewal.id, policy.expirationDate, policy.type);

        // Log activity
        await prisma.activity.create({
          data: {
            clientId: policy.clientId,
            renewalId: renewal.id,
            type: 'STATUS_CHANGED',
            title: 'Renewal Created',
            description: `Auto-created renewal for ${policy.type} policy expiring ${policy.expirationDate.toLocaleDateString()}`,
          },
        });

        result.created++;
        console.log(`[Renewal Job] Created renewal for policy ${policy.policyNumber}`);
      } catch (err: any) {
        result.errors.push(`Policy ${policy.policyNumber}: ${err.message}`);
        console.error(`[Renewal Job] Error creating renewal for ${policy.policyNumber}:`, err.message);
      }
    }
  } catch (err: any) {
    result.errors.push(`Job error: ${err.message}`);
    console.error('[Renewal Job] Fatal error:', err);
  }

  return result;
}

/**
 * Update task statuses based on due dates
 */
export async function updateOverdueTasks(): Promise<number> {
  const now = new Date();

  const result = await prisma.task.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    data: {
      status: 'OVERDUE',
    },
  });

  if (result.count > 0) {
    console.log(`[Renewal Job] Marked ${result.count} tasks as overdue`);
  }

  return result.count;
}

/**
 * Get escalations for renewals that need attention
 */
export async function getEscalations(): Promise<any[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Find renewals with issues
  const escalations = await prisma.renewal.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lte: thirtyDaysFromNow },
      OR: [
        // No quotes received with < 30 days
        { quotesReceived: 0, dueDate: { lte: thirtyDaysFromNow } },
        // High risk without recent activity
        { riskScore: 'HIGH', lastTouchedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
    include: {
      client: true,
      policy: true,
      tasks: {
        where: { status: 'OVERDUE' },
      },
    },
  });

  return escalations.map(r => ({
    renewalId: r.id,
    clientName: r.client.company,
    policyType: r.policy.type,
    daysUntilDue: Math.ceil((r.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    riskScore: r.riskScore,
    reason: r.quotesReceived === 0 ? 'No quotes received' : 'High risk with no recent activity',
    overdueTasks: r.tasks.length,
  }));
}

/**
 * Seed default task templates
 */
export async function seedTaskTemplates(): Promise<void> {
  const existingCount = await prisma.taskTemplate.count();

  if (existingCount === 0) {
    await prisma.taskTemplate.createMany({
      data: DEFAULT_TASK_TEMPLATES.map(t => ({
        ...t,
        priority: t.priority as any,
        category: t.category as any,
      })),
    });
    console.log('[Renewal Job] Seeded default task templates');
  }
}
