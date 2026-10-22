import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STAGES = ['Planning', 'Development', 'Testing', 'Review', 'Deployed'];

async function main() {
  console.log('🌱 Starting database seeding for OrgGraph...');

  // Clean existing tables in reverse dependency order
  await prisma.blocker.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.stage.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('🧹 Cleaned existing tables.');

  const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
  const employeePasswordHash = await bcrypt.hash('Employee@123', 10);

  // 1. Create Departments
  const departmentsData = [
    { name: 'Engineering', code: 'ENG', description: 'Core product engineering, systems, and cloud infrastructure' },
    { name: 'Marketing', code: 'MKT', description: 'Brand expansion, demand generation, and customer acquisition' },
    { name: 'HR', code: 'HR', description: 'Talent recruitment, people operations, and cultural initiatives' },
    { name: 'Finance', code: 'FIN', description: 'Financial forecasting, accounting, audit, and fiscal compliance' },
    { name: 'Operations', code: 'OPS', description: 'Business operations, cloud provisioning, and vendor logistics' }
  ];

  const departments = {};
  for (const dept of departmentsData) {
    departments[dept.name] = await prisma.department.create({ data: dept });
  }

  // 2. Create Teams (2 per department = 10 teams)
  const teamsData = [
    { name: 'Frontend Core', departmentId: departments['Engineering'].id },
    { name: 'Backend & Cloud', departmentId: departments['Engineering'].id },
    { name: 'Growth & Acquisition', departmentId: departments['Marketing'].id },
    { name: 'Brand & Content', departmentId: departments['Marketing'].id },
    { name: 'Talent & Recruiting', departmentId: departments['HR'].id },
    { name: 'People Operations', departmentId: departments['HR'].id },
    { name: 'Financial Planning & Analysis', departmentId: departments['Finance'].id },
    { name: 'Accounting & Audit', departmentId: departments['Finance'].id },
    { name: 'Cloud Infrastructure', departmentId: departments['Operations'].id },
    { name: 'Procurement & Logistics', departmentId: departments['Operations'].id },
  ];

  const teams = {};
  for (const t of teamsData) {
    const createdTeam = await prisma.team.create({ data: t });
    teams[t.name] = createdTeam;
  }

  // 3. Create Manager
  const manager = await prisma.user.create({
    data: {
      name: 'Eleanor Vance',
      email: 'manager@orggraph.internal',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
    }
  });

  // 4. Create Employees
  const employeesData = [
    { name: 'Alice Chen', email: 'alice@eng.orggraph.internal', dept: 'Engineering', team: 'Frontend Core' },
    { name: 'Bob Martinez', email: 'bob@eng.orggraph.internal', dept: 'Engineering', team: 'Backend & Cloud' },
    { name: 'Charlie Kim', email: 'charlie@mkt.orggraph.internal', dept: 'Marketing', team: 'Growth & Acquisition' },
    { name: 'Diana Ross', email: 'diana@mkt.orggraph.internal', dept: 'Marketing', team: 'Brand & Content' },
    { name: 'Evan Wright', email: 'evan@hr.orggraph.internal', dept: 'HR', team: 'Talent & Recruiting' },
    { name: 'Fiona Gallagher', email: 'fiona@hr.orggraph.internal', dept: 'HR', team: 'People Operations' },
    { name: 'George Bailey', email: 'george@fin.orggraph.internal', dept: 'Finance', team: 'Financial Planning & Analysis' },
    { name: 'Helen Mirren', email: 'helen@fin.orggraph.internal', dept: 'Finance', team: 'Accounting & Audit' },
    { name: 'Ian Malcolm', email: 'ian@ops.orggraph.internal', dept: 'Operations', team: 'Cloud Infrastructure' },
    { name: 'Julia Roberts', email: 'julia@ops.orggraph.internal', dept: 'Operations', team: 'Procurement & Logistics' },
  ];

  const employees = {};
  for (const emp of employeesData) {
    const createdEmp = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        passwordHash: employeePasswordHash,
        role: 'EMPLOYEE',
        departmentId: departments[emp.dept].id,
        teamId: teams[emp.team].id,
      }
    });
    employees[emp.name] = createdEmp;
  }

  // Helper to calculate stage statuses
  function buildStages(projectId, currentStageName) {
    const currentIndex = STAGES.indexOf(currentStageName);
    return STAGES.map((stg, idx) => {
      let status = 'PENDING';
      let completedAt = null;
      if (idx < currentIndex) {
        status = 'COMPLETED';
        completedAt = new Date(Date.now() - (currentIndex - idx) * 7 * 86400000);
      } else if (idx === currentIndex) {
        status = 'CURRENT';
      }
      return {
        projectId,
        name: stg,
        order: idx + 1,
        status,
        completedAt,
      };
    });
  }

  // 5. Create Projects
  const projectsData = [
    {
      name: 'NextGen Customer Portal',
      description: 'Modern customer self-service dashboard with unified billing and usage analytics.',
      dept: 'Engineering',
      team: 'Frontend Core',
      status: 'ON_TRACK',
      progress: 65,
      priority: 'HIGH',
      currentStage: 'Development',
      deadline: new Date(Date.now() + 30 * 86400000),
      author: 'Alice Chen',
      summary: 'Completed dashboard component library and API integration. Responsive layout validated.',
      tasks: ['Implemented widget grid', 'Integrated GraphQL client', 'Design sign-off received'],
      blockers: [],
      risks: ['Potential delay if billing API spec changes'],
      nextMilestone: 'Sprint review with product owner on Friday'
    },
    {
      name: 'Global Distributed Cache',
      description: 'Ultra-low latency Redis and edge memory caching layer for real-time transactions.',
      dept: 'Engineering',
      team: 'Backend & Cloud',
      status: 'AT_RISK',
      progress: 80,
      priority: 'CRITICAL',
      currentStage: 'Testing',
      deadline: new Date(Date.now() + 14 * 86400000),
      author: 'Bob Martinez',
      summary: 'Completed load testing on North America cluster. European cluster shows packet loss.',
      tasks: ['Benchmark 100k QPS', 'Failover automated script', 'Grafana alerts configured'],
      blockers: ['Latency spike in EU-West-1 cluster under peak simulated loads'],
      risks: ['Cross-region replication lag exceeds SLA by 15ms'],
      nextMilestone: 'Kernel network parameter optimization in EU test cluster'
    },
    {
      name: 'Q3 Omni-channel Campaign',
      description: 'Multichannel marketing push targeting enterprise decision makers across LinkedIn and search.',
      dept: 'Marketing',
      team: 'Growth & Acquisition',
      status: 'ON_TRACK',
      progress: 90,
      priority: 'HIGH',
      currentStage: 'Review',
      deadline: new Date(Date.now() + 10 * 86400000),
      author: 'Charlie Kim',
      summary: 'Creative assets finalized and targeting parameters locked. Awaiting final CMO sign-off.',
      tasks: ['Ad copy finalized in 4 variants', 'UTM tracking verified', 'Landing page A/B tests ready'],
      blockers: [],
      risks: ['High ad spend CPC volatility in Q3 beginning'],
      nextMilestone: 'Full campaign rollout launch on Monday'
    },
    {
      name: 'Rebranding Design System',
      description: 'Unified corporate visual identity, typography, tokens, and web component guidelines.',
      dept: 'Marketing',
      team: 'Brand & Content',
      status: 'COMPLETED',
      progress: 100,
      priority: 'MEDIUM',
      currentStage: 'Deployed',
      deadline: new Date(Date.now() - 5 * 86400000),
      author: 'Diana Ross',
      summary: 'Brand guidelines published to Figma and company knowledge base. All teams onboarded.',
      tasks: ['Token export script created', 'Figma community library published', 'All department logos updated'],
      blockers: [],
      risks: [],
      nextMilestone: 'Quarterly brand compliance review'
    },
    {
      name: 'AI-Assisted Candidate Screening',
      description: 'Intelligent resume matching and candidate skills ranking tool for recruiting teams.',
      dept: 'HR',
      team: 'Talent & Recruiting',
      status: 'DELAYED',
      progress: 45,
      priority: 'HIGH',
      currentStage: 'Development',
      deadline: new Date(Date.now() + 45 * 86400000),
      author: 'Evan Wright',
      summary: 'Core parsing prototype ready. Legal compliance review regarding bias auditing has halted progress.',
      tasks: ['Resume text parser benchmarked', 'ATS webhook integration built'],
      blockers: ['Legal & Compliance review pending for automated decision making privacy rules'],
      risks: ['May miss Q4 high-volume hiring cycle if approval takes > 3 weeks'],
      nextMilestone: 'Joint audit session with external compliance counsel'
    },
    {
      name: 'Automated Payroll Reconciliation',
      description: 'Daily automated reconciliation between bank feeds, time-tracking, and benefits ledger.',
      dept: 'Finance',
      team: 'Accounting & Audit',
      status: 'ON_TRACK',
      progress: 75,
      priority: 'MEDIUM',
      currentStage: 'Testing',
      deadline: new Date(Date.now() + 20 * 86400000),
      author: 'Helen Mirren',
      summary: 'Bank rule parser implemented. Test run reconciled 99.8% of test payroll transactions.',
      tasks: ['Reconciliation rule matrix created', 'Exception report notification service built'],
      blockers: [],
      risks: ['Manual intervention still required for foreign currency remittances'],
      nextMilestone: 'Dual-run validation with legacy spreadsheet for upcoming pay cycle'
    },
    {
      name: 'Multi-Region Cloud Migration',
      description: 'Zero-downtime migration of customer data clusters from single zone to multi-zone resilience.',
      dept: 'Operations',
      team: 'Cloud Infrastructure',
      status: 'ON_TRACK',
      progress: 25,
      priority: 'CRITICAL',
      currentStage: 'Planning',
      deadline: new Date(Date.now() + 90 * 86400000),
      author: 'Ian Malcolm',
      summary: 'Terraform blueprints drafted and cloud architect peer review completed.',
      tasks: ['Architecture review approved', 'Cost estimation model signed off by VP'],
      blockers: [],
      risks: ['Cloud provider quota increase approval delays'],
      nextMilestone: 'Staging environment VPC peering and security group provisioning'
    },
    {
      name: 'Enterprise ERP Procurement',
      description: 'Vendor evaluation, RFP scoring, and contract finalization for unified corporate ERP.',
      dept: 'Operations',
      team: 'Procurement & Logistics',
      status: 'AT_RISK',
      progress: 50,
      priority: 'MEDIUM',
      currentStage: 'Development',
      deadline: new Date(Date.now() + 60 * 86400000),
      author: 'Julia Roberts',
      summary: 'Narrowed down to two top vendors. Contract negotiations stalled over indemnification clauses.',
      tasks: ['RFP response scoring completed', 'Reference customer check calls finished'],
      blockers: ['Primary vendor legal team rejecting standard IP indemnification terms'],
      risks: ['Pricing discount expires at end of current month'],
      nextMilestone: 'Executive sponsor escalation call with vendor VP of Sales'
    }
  ];

  for (const proj of projectsData) {
    const createdProj = await prisma.project.create({
      data: {
        name: proj.name,
        description: proj.description,
        departmentId: departments[proj.dept].id,
        teamId: teams[proj.team].id,
        status: proj.status,
        progress: proj.progress,
        priority: proj.priority,
        currentStage: proj.currentStage,
        deadline: proj.deadline,
        lastUpdated: new Date(),
      }
    });

    // Create 5 stages
    const stageItems = buildStages(createdProj.id, proj.currentStage);
    for (const stg of stageItems) {
      await prisma.stage.create({ data: stg });
    }

    // Create initial report
    const authorUser = employees[proj.author] || manager;
    const createdReport = await prisma.report.create({
      data: {
        projectId: createdProj.id,
        authorId: authorUser.id,
        stage: proj.currentStage,
        progress: proj.progress,
        summary: proj.summary,
        completedTasks: JSON.stringify(proj.tasks),
        risks: JSON.stringify(proj.risks),
        peopleMentioned: JSON.stringify([authorUser.name, 'Eleanor Vance']),
        nextMilestone: proj.nextMilestone,
        rawText: `Weekly project update for ${proj.name}.\n\nCurrent Stage: ${proj.currentStage}\nProgress: ${proj.progress}%\n\nSummary:\n${proj.summary}\n\nCompleted Tasks:\n- ${proj.tasks.join('\n- ')}\n\nBlockers:\n- ${proj.blockers.length ? proj.blockers.join('\n- ') : 'None'}\n\nRisks:\n- ${proj.risks.length ? proj.risks.join('\n- ') : 'None'}\n\nNext Milestone: ${proj.nextMilestone}`,
        fileName: `${proj.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_status.txt`,
      }
    });

    // Create blockers if any
    for (const b of proj.blockers) {
      await prisma.blocker.create({
        data: {
          projectId: createdProj.id,
          reportId: createdReport.id,
          description: b,
          severity: proj.status === 'DELAYED' ? 'BLOCKING' : 'HIGH',
          resolved: false,
        }
      });
    }
  }

  console.log('✅ Database seeded successfully with:');
  console.log('- 1 Manager: manager@orggraph.internal / Manager@123');
  console.log('- 5 Departments (Engineering, Marketing, HR, Finance, Operations)');
  console.log('- 10 Teams (2 per department)');
  console.log('- 10 Employees (password: Employee@123)');
  console.log('- 8 Projects across various stages with reports and blockers');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
