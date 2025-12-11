import { Renewal, ChatMessage, EmailTemplate, Source, MeetingAgendaItem, TalkingPoint } from '@/types/broker';

export const mockSources: Source[] = [
  {
    id: 's1',
    type: 'salesforce',
    label: 'Account Activity',
    timestamp: '2024-01-04T10:30:00Z',
    relativeTime: '14 days ago',
    preview: 'Email sent regarding renewal options. Client requested competitive quotes.',
    fullContent: 'Full Salesforce record: Account activity log showing email communication on Jan 4th. Subject: "2024 Renewal Options for TechFlow Solutions". The client expressed interest in exploring competitive quotes from other carriers before committing to renewal. Follow-up scheduled for Jan 18th.',
  },
  {
    id: 's2',
    type: 'outlook',
    label: 'Email Thread',
    timestamp: '2024-01-13T14:20:00Z',
    relativeTime: '5 days ago',
    preview: 'RE: Competitor Quote - Liberty Mutual offering $41,500 annual premium',
    fullContent: 'Email from Sarah Mitchell: "Hi Michael, I wanted to share that we received a quote from Liberty Mutual for $41,500 annual premium. Their coverage terms are similar to our current policy. Could you review and let me know if Hartford can match or beat this offer? Thanks, Sarah"',
  },
  {
    id: 's3',
    type: 'calendar',
    label: 'Meeting Scheduled',
    timestamp: '2024-01-20T09:00:00Z',
    relativeTime: 'Tomorrow',
    preview: 'Renewal Review Call - 30 min video conference',
    fullContent: 'Calendar event: Renewal Review Call with TechFlow Solutions. Attendees: Sarah Mitchell (CFO), Michael Chen (Broker). Agenda: Review current coverage, discuss competitor quotes, present Hartford renewal options.',
  },
  {
    id: 's4',
    type: 'quotesys',
    label: 'Quote Activity',
    timestamp: '2024-01-15T11:45:00Z',
    relativeTime: '3 days ago',
    preview: 'New quote generated: Hartford Commercial Property - $47,250',
    fullContent: 'Quote System Record: Hartford Commercial Property Insurance Quote #HRT-2024-0847. Premium: $47,250/year. Coverage Limit: $2,500,000. Deductible: $5,000. Status: Pending client review.',
  },
  {
    id: 's5',
    type: 'hubspot',
    label: 'Engagement Score',
    timestamp: '2024-01-17T16:00:00Z',
    relativeTime: '1 day ago',
    preview: 'Email opened 3x, proposal PDF downloaded',
    fullContent: 'HubSpot Engagement: Email "2024 Renewal Proposal" opened 3 times. Proposal PDF downloaded on Jan 17th at 4:02 PM. Time spent on pricing page: 4 minutes 23 seconds.',
  },
];

export const mockRenewals: Renewal[] = [
  {
    id: 'r1',
    client: {
      id: 'c1',
      name: 'Sarah Mitchell',
      company: 'TechFlow Solutions',
      email: 'sarah@techflow.com',
      phone: '+1 (555) 123-4567',
      industry: 'Technology',
    },
    policy: {
      id: 'POL-2024-0847',
      type: 'Commercial Property',
      carrier: 'Hartford Insurance',
      premium: 45000,
      coverageLimit: 2000000,
      effectiveDate: '2023-01-25',
      expirationDate: '2024-01-25',
    },
    daysUntilRenewal: 7,
    renewalDate: '2024-01-25',
    riskScore: 'high',
    riskFactors: ['No response to 3 outreach attempts', 'Competitor quote requested', 'Premium increase expected (12%)'],
    lastContact: '2024-01-04',
    assignedBroker: 'Michael Chen',
    sources: [mockSources[0], mockSources[1], mockSources[3]],
    aiInsights: [
      'Client requested quotes from 2 competitors this month - Liberty Mutual and Travelers',
      'Premium likely to increase 12% based on regional claims trends and property value reassessment',
      'Key decision maker changed in Q3 - verify Sarah Mitchell has authority to sign',
      'Consider bundling with cyber liability for 8% multi-policy discount',
    ],
    aiSummary: 'High-risk renewal requiring immediate attention. Client is actively shopping with competitors and has been unresponsive to recent outreach. Premium increase of ~12% expected, which may trigger price sensitivity. Recommend scheduling urgent review call to present value proposition before Liberty Mutual finalizes their offer.',
    metrics: { emailsSent: 5, quotesReceived: 2, lastTouchedDays: 14, meetingsScheduled: 1 },
    status: 'at_risk',
  },
  {
    id: 'r2',
    client: {
      id: 'c2',
      name: 'Robert Chen',
      company: 'Pacific Manufacturing',
      email: 'rchen@pacificmfg.com',
      phone: '+1 (555) 234-5678',
      industry: 'Manufacturing',
    },
    policy: {
      id: 'POL-2024-1203',
      type: 'Workers Compensation',
      carrier: 'Travelers',
      premium: 128000,
      coverageLimit: 5000000,
      effectiveDate: '2023-02-01',
      expirationDate: '2024-02-01',
    },
    daysUntilRenewal: 14,
    renewalDate: '2024-02-01',
    riskScore: 'medium',
    riskFactors: ['2 claims filed in past year ($45K total)', 'Industry facing rate increases'],
    lastContact: '2024-01-10',
    assignedBroker: 'Michael Chen',
    sources: [
      { ...mockSources[0], id: 's6', preview: 'Renewal review call confirmed for Jan 20', relativeTime: '3 days ago' },
      { ...mockSources[4], id: 's7' },
    ],
    aiInsights: [
      'Strong 8-year relationship with consistent renewals',
      'Consider bundling with general liability for 10% discount opportunity',
      'Safety program improvements in Q4 could reduce experience mod by 0.15',
    ],
    aiSummary: 'Medium-risk renewal with long-term loyal client. Two claims this year will impact pricing, but strong relationship and safety improvements provide negotiating leverage. Client has engaged well with renewal materials.',
    metrics: { emailsSent: 3, quotesReceived: 1, lastTouchedDays: 8, meetingsScheduled: 2 },
    status: 'in_progress',
  },
  {
    id: 'r3',
    client: {
      id: 'c3',
      name: 'Jennifer Walsh',
      company: 'Coastal Hospitality Group',
      email: 'jwalsh@coastalhg.com',
      phone: '+1 (555) 345-6789',
      industry: 'Hospitality',
    },
    policy: {
      id: 'POL-2024-0892',
      type: 'General Liability',
      carrier: 'Chubb',
      premium: 67500,
      coverageLimit: 3000000,
      effectiveDate: '2023-01-21',
      expirationDate: '2024-01-21',
    },
    daysUntilRenewal: 3,
    renewalDate: '2024-01-21',
    riskScore: 'high',
    riskFactors: ['Renewal in 3 days - no confirmation received', 'Previous late payments (2)', 'Coverage gap concerns raised'],
    lastContact: '2024-01-15',
    assignedBroker: 'Emily Rodriguez',
    sources: [
      { ...mockSources[1], id: 's8', type: 'outlook', preview: 'Left voicemail about urgent renewal deadline', relativeTime: '2 days ago' },
      { ...mockSources[0], id: 's9', type: 'applied', label: 'Payment History', preview: '2 late payments in past 12 months' },
    ],
    aiInsights: [
      '⚠️ URGENT: Only 3 days until renewal deadline - escalate immediately',
      'Consider offering flexible payment plan to secure renewal commitment',
      'New venue opening Q2 may require liquor liability endorsement addition',
    ],
    aiSummary: 'Critical situation - renewal deadline in 3 days with no client confirmation. Payment history shows potential cash flow issues. Recommend CEO escalation and offering payment flexibility to prevent lapse.',
    metrics: { emailsSent: 7, quotesReceived: 1, lastTouchedDays: 3, meetingsScheduled: 0 },
    status: 'at_risk',
  },
  {
    id: 'r4',
    client: {
      id: 'c4',
      name: 'David Park',
      company: 'Summit Healthcare',
      email: 'dpark@summithc.com',
      phone: '+1 (555) 456-7890',
      industry: 'Healthcare',
    },
    policy: {
      id: 'POL-2024-1456',
      type: 'Professional Liability',
      carrier: 'AIG',
      premium: 215000,
      coverageLimit: 10000000,
      effectiveDate: '2023-02-08',
      expirationDate: '2024-02-08',
    },
    daysUntilRenewal: 21,
    renewalDate: '2024-02-08',
    riskScore: 'low',
    riskFactors: [],
    lastContact: '2024-01-16',
    assignedBroker: 'Emily Rodriguez',
    sources: [
      { ...mockSources[0], id: 's10', preview: 'Client confirmed renewal at current terms', relativeTime: '2 days ago' },
      { ...mockSources[2], id: 's11', preview: 'Final paperwork meeting Jan 25', relativeTime: 'scheduled' },
    ],
    aiInsights: [
      'Low risk - long-term satisfied client with excellent claims history',
      'Opportunity: Upsell cyber liability coverage ($18K premium potential)',
      'New facility opening in March - discuss additional coverage needs',
    ],
    aiSummary: 'Secured renewal with loyal 6-year client. Excellent opportunity to expand relationship with cyber liability coverage for new telemedicine platform. Client has already verbally confirmed renewal.',
    metrics: { emailsSent: 2, quotesReceived: 1, lastTouchedDays: 2, meetingsScheduled: 1 },
    status: 'secured',
  },
  {
    id: 'r5',
    client: {
      id: 'c5',
      name: 'Amanda Foster',
      company: 'GreenLeaf Construction',
      email: 'afoster@greenleaf.com',
      phone: '+1 (555) 567-8901',
      industry: 'Construction',
    },
    policy: {
      id: 'POL-2024-0934',
      type: "Builder's Risk",
      carrier: 'Zurich',
      premium: 89000,
      coverageLimit: 4500000,
      effectiveDate: '2023-01-28',
      expirationDate: '2024-01-28',
    },
    daysUntilRenewal: 10,
    renewalDate: '2024-01-28',
    riskScore: 'medium',
    riskFactors: ['New project scope requires coverage review', 'Subcontractor requirements changing'],
    lastContact: '2024-01-12',
    assignedBroker: 'Michael Chen',
    sources: [
      { ...mockSources[1], id: 's12', type: 'outlook', preview: 'Sent updated coverage options for 2024 projects', relativeTime: '6 days ago' },
      { ...mockSources[0], id: 's13', type: 'ams360', label: 'Policy Notes', preview: 'Client expanding to commercial projects' },
    ],
    aiInsights: [
      'Growing client - revenue up 40% YoY, expanding into commercial sector',
      'New project types may require additional endorsements and higher limits',
      'Consider umbrella policy recommendation for increased protection',
    ],
    aiSummary: 'Growing construction client expanding into new market segments. Coverage review needed to ensure adequate protection for commercial projects. Good opportunity to increase policy limits and add umbrella coverage.',
    metrics: { emailsSent: 4, quotesReceived: 2, lastTouchedDays: 6, meetingsScheduled: 1 },
    status: 'in_progress',
  },
  {
    id: 'r6',
    client: {
      id: 'c6',
      name: 'Marcus Johnson',
      company: 'Metro Logistics',
      email: 'mjohnson@metrologistics.com',
      phone: '+1 (555) 678-9012',
      industry: 'Transportation',
    },
    policy: {
      id: 'POL-2024-1178',
      type: 'Commercial Auto',
      carrier: 'Progressive Commercial',
      premium: 156000,
      coverageLimit: 2500000,
      effectiveDate: '2023-01-23',
      expirationDate: '2024-01-23',
    },
    daysUntilRenewal: 5,
    renewalDate: '2024-01-23',
    riskScore: 'low',
    riskFactors: [],
    lastContact: '2024-01-17',
    assignedBroker: 'Emily Rodriguez',
    sources: [
      { ...mockSources[0], id: 's14', preview: 'Discussed fleet expansion and renewal terms', relativeTime: '1 day ago' },
      { ...mockSources[2], id: 's15', type: 'gmail', label: 'Signed Docs', preview: 'Received signed renewal documents', relativeTime: 'today' },
    ],
    aiInsights: [
      '✓ Renewal secured - all documents signed and received',
      'Fleet expanding by 15 vehicles in Q2 - schedule coverage review',
      'Perfect opportunity to discuss telematics discount program',
    ],
    aiSummary: 'Renewal completed successfully with signed documentation received. Client is expanding fleet which presents opportunity for coverage expansion in Q2. Strong relationship with engaged client.',
    metrics: { emailsSent: 3, quotesReceived: 1, lastTouchedDays: 1, meetingsScheduled: 2 },
    status: 'secured',
  },
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'What are the key risks for TechFlow Solutions renewal?',
    timestamp: '2024-01-18T10:30:00Z',
  },
  {
    id: 'm2',
    role: 'assistant',
    content: `Based on my analysis of TechFlow Solutions, there are **three critical risk factors** to address immediately:

**1. Active Competitor Shopping** [1]
The client has received and is evaluating a quote from Liberty Mutual at $41,500 annual premium - 8% below current pricing. They've also reached out to Travelers.

**2. Communication Gap** [2]
No response to the last 3 outreach attempts over 14 days. This is unusual behavior for Sarah Mitchell who typically responds within 48 hours.

**3. Expected Premium Increase** [3]
Based on regional claims trends and property value reassessment, expect a 12% premium increase which may trigger price sensitivity given the competitive quotes in hand.

**Recommended Actions:**
- Schedule urgent call before Liberty Mutual deadline (likely Jan 22)
- Prepare value proposition emphasizing Hartford's claims service
- Consider multi-policy discount if bundling cyber liability`,
    sources: [
      { ...mockSources[1], id: 'cs1' },
      { ...mockSources[0], id: 'cs2' },
      { ...mockSources[3], id: 'cs3' },
    ],
    timestamp: '2024-01-18T10:30:15Z',
  },
];

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'et1',
    name: 'Renewal Reminder',
    type: 'renewal_reminder',
    subject: 'Your {{policy_type}} Policy Renewal - Action Required',
    body: `Dear {{client_name}},

I hope this message finds you well. I'm reaching out regarding your upcoming {{policy_type}} policy renewal with {{carrier}}, which expires on {{expiration_date}}.

Your current annual premium is {{current_premium}}, and I've prepared a renewal proposal for your review.

Key highlights:
• Coverage limit: {{coverage_limit}}
• No claims in the past year
• Loyalty discount applied

Please let me know a convenient time to discuss your renewal options. I'm available for a call this week.

Best regards,
{{broker_name}}`,
  },
  {
    id: 'et2',
    name: 'Policy Update',
    type: 'policy_update',
    subject: 'Important Update to Your {{policy_type}} Coverage',
    body: `Dear {{client_name}},

I wanted to inform you of some important updates to your {{policy_type}} policy that may affect your coverage.

{{update_details}}

Please review these changes and let me know if you have any questions.

Best regards,
{{broker_name}}`,
  },
  {
    id: 'et3',
    name: 'Claims Follow-up',
    type: 'claims_followup',
    subject: 'Following Up on Your Recent Claim',
    body: `Dear {{client_name}},

I wanted to check in on your recent claim filed on {{claim_date}}. 

Current status: {{claim_status}}

Please don't hesitate to reach out if you need any assistance.

Best regards,
{{broker_name}}`,
  },
];

export const mockAgendaItems: MeetingAgendaItem[] = [
  { id: 'a1', topic: 'Review current coverage and claims history', duration: 10, notes: 'Highlight zero claims record', isAISuggested: false },
  { id: 'a2', topic: 'Discuss competitor quotes and price matching', duration: 15, notes: 'Address Liberty Mutual offer', isAISuggested: true },
  { id: 'a3', topic: 'Present value proposition and carrier benefits', duration: 10, notes: 'Emphasize Hartford claims service', isAISuggested: true },
  { id: 'a4', topic: 'Explore bundling opportunities', duration: 10, notes: 'Cyber liability discount option', isAISuggested: true },
  { id: 'a5', topic: 'Next steps and timeline', duration: 5, notes: 'Confirm decision deadline', isAISuggested: false },
];

export const mockTalkingPoints: TalkingPoint[] = [
  { id: 'tp1', title: 'Competitor Price Sensitivity', content: 'Client received Liberty Mutual quote at $41,500 (8% below current). Be prepared to discuss value vs. price and potential matching strategies.', type: 'risk', priority: 'high' },
  { id: 'tp2', title: 'Decision Maker Change', content: 'Verify Sarah Mitchell has full authority to sign. Previous CFO James Morrison left in Q3.', type: 'risk', priority: 'medium' },
  { id: 'tp3', title: 'Cyber Liability Bundle', content: 'Offering cyber liability policy can provide 8% multi-policy discount, potentially matching competitor pricing while increasing coverage.', type: 'opportunity', priority: 'high' },
  { id: 'tp4', title: 'Hartford Claims Excellence', content: 'Hartford has 4.8/5 claims satisfaction rating vs. Liberty Mutual 4.2/5. Emphasize faster claims processing (avg 72hrs vs 5 days).', type: 'info', priority: 'medium' },
];

export const suggestedQuestions = [
  "What renewals need immediate attention this week?",
  "Show me clients with competitor quotes",
  "Which policies have the highest upsell potential?",
  "What are the top risk factors across my portfolio?",
  "List clients I haven't contacted in over 30 days",
  "Compare TechFlow's current coverage to Liberty Mutual quote",
];
