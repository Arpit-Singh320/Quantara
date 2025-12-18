/**
 * Database Seed Script
 * Creates demo data for testing and development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@quantara.io' },
    update: {},
    create: {
      email: 'demo@quantara.io',
      passwordHash,
      name: 'Demo User',
      company: 'Quantara Insurance',
      role: 'BROKER',
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create demo clients
  const clients = [
    {
      name: 'Sarah Chen',
      company: 'TechFlow Solutions',
      email: 'sarah.chen@techflow.com',
      phone: '(555) 123-4567',
      industry: 'Technology',
    },
    {
      name: 'Michael Rodriguez',
      company: 'BuildRight Construction',
      email: 'mrodriguez@buildright.com',
      phone: '(555) 234-5678',
      industry: 'Construction',
    },
    {
      name: 'Jennifer Walsh',
      company: 'MedCare Partners',
      email: 'jwalsh@medcare.com',
      phone: '(555) 345-6789',
      industry: 'Healthcare',
    },
    {
      name: 'David Kim',
      company: 'Pacific Logistics',
      email: 'dkim@pacificlogistics.com',
      phone: '(555) 456-7890',
      industry: 'Transportation',
    },
    {
      name: 'Amanda Foster',
      company: 'GreenLeaf Manufacturing',
      email: 'afoster@greenleaf.com',
      phone: '(555) 567-8901',
      industry: 'Manufacturing',
    },
  ];

  const createdClients = [];
  for (const clientData of clients) {
    const client = await prisma.client.upsert({
      where: {
        userId_externalId: {
          userId: demoUser.id,
          externalId: clientData.email,
        },
      },
      update: clientData,
      create: {
        ...clientData,
        userId: demoUser.id,
        externalId: clientData.email,
      },
    });
    createdClients.push(client);
    console.log(`✅ Created client: ${client.company}`);
  }

  // Create policies for each client
  const policyTypes = [
    'GENERAL_LIABILITY',
    'PROFESSIONAL_LIABILITY',
    'CYBER_LIABILITY',
    'WORKERS_COMPENSATION',
    'PROPERTY',
  ] as const;

  const carriers = [
    'Liberty Mutual',
    'Travelers',
    'Hartford',
    'Chubb',
    'AIG',
  ];

  const createdPolicies = [];
  for (let i = 0; i < createdClients.length; i++) {
    const client = createdClients[i];
    const policyType = policyTypes[i % policyTypes.length];
    const carrier = carriers[i % carriers.length];

    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() - 10);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (7 + i * 5)); // Stagger expiration dates

    const policy = await prisma.policy.upsert({
      where: {
        userId_policyNumber: {
          userId: demoUser.id,
          policyNumber: `POL-${2024}${String(i + 1).padStart(4, '0')}`,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        clientId: client.id,
        policyNumber: `POL-${2024}${String(i + 1).padStart(4, '0')}`,
        type: policyType,
        carrier,
        premium: 15000 + Math.floor(Math.random() * 35000),
        coverageLimit: 1000000 + Math.floor(Math.random() * 4000000),
        deductible: 5000 + Math.floor(Math.random() * 15000),
        effectiveDate,
        expirationDate,
        status: 'ACTIVE',
      },
    });
    createdPolicies.push(policy);
    console.log(`✅ Created policy: ${policy.policyNumber} for ${client.company}`);
  }

  // Create renewals for policies
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;
  const riskFactorsMap = {
    HIGH: ['Competitor quote received', 'Payment delays', 'Claims history'],
    MEDIUM: ['Premium increase expected', 'Coverage review needed'],
    LOW: ['Long-term client', 'Good payment history'],
  };

  for (let i = 0; i < createdPolicies.length; i++) {
    const policy = createdPolicies[i];
    const client = createdClients[i];
    const riskLevel = riskLevels[i % 3];

    const renewal = await prisma.renewal.upsert({
      where: { id: `renewal-${policy.id}` },
      update: {},
      create: {
        id: `renewal-${policy.id}`,
        userId: demoUser.id,
        clientId: client.id,
        policyId: policy.id,
        dueDate: policy.expirationDate,
        status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
        riskScore: riskLevel,
        riskFactors: riskFactorsMap[riskLevel],
        aiSummary: `${client.company} renewal requires attention. ${riskLevel === 'HIGH' ? 'Immediate action recommended.' : 'Standard renewal process.'}`,
        aiInsights: [
          `Client has been with us for ${2 + i} years`,
          `Current premium: $${policy.premium.toLocaleString()}`,
          riskLevel === 'HIGH' ? 'Consider competitive pricing' : 'Standard renewal terms recommended',
        ],
        priority: riskLevel === 'HIGH' ? 3 : riskLevel === 'MEDIUM' ? 2 : 1,
      },
    });
    console.log(`✅ Created renewal for: ${client.company} (${riskLevel} risk)`);
  }

  // Create some activities
  for (const client of createdClients.slice(0, 3)) {
    await prisma.activity.create({
      data: {
        clientId: client.id,
        type: 'EMAIL_SENT',
        title: 'Renewal reminder sent',
        description: `Sent renewal reminder email to ${client.name}`,
      },
    });
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@quantara.io');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
