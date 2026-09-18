// Every string here is drawn from `knowledge/flowdeck-knowledge-base.md`.
// Nothing below adds a feature, number, claim or name that file does not contain.

export const hero = {
  lines: ['Warehouse, fleet, orders and billing.', 'All in one system.'],
  sub: 'Flowdeck is an operations software for logistics and 3PL companies. Four modules that read from the same data, so nothing has to be cross-checked between tools.',
  note: 'Built in Bengaluru by a team that ran a 3PL themselves.',
  askPlaceholder: 'Ask anything about Flowdeck',
};

export const convergence = {
  tiles: ['Warehouse system', 'Dispatch tool', 'Spreadsheets', 'Invoicing software'],
  before: {
    title: 'Most tools in this space solve one problem.',
  },
  after: {
    title: 'Flowdeck is built as one system instead of four.',
    body: 'Warehouse, fleet, orders and billing reconciliation all read from the same data. When an order moves from warehouse to delivery, the same record carries through to reconciliation.',
  },
};

export const modules = {
  title: 'Products',
  items: [
    {
      key: 'stock',
      name: 'Warehouse management',
      body: 'Real time stock levels across every location, with alerts when inventory runs low and a unified view for operators managing more than one warehouse.',
    },
    {
      key: 'route',
      name: 'Fleet and dispatch',
      body: 'Tracks vehicles, assigns routes, and gives live delivery status. Dispatchers see which driver is closest to a new order and assign it without leaving the dashboard.',
    },
    {
      key: 'order',
      name: 'Order orchestration',
      body: 'Takes an order in from any sales channel and routes it to the warehouse best placed to fulfill it, based on stock and location. Status updates sync back automatically, so the customer always sees accurate delivery information.',
    },
    {
      key: 'invoice',
      name: 'Billing reconciliation',
      body: 'Every delivered order is automatically matched against the corresponding carrier invoice and warehouse handling charge. If something does not match, Flowdeck flags it before the invoice is paid.',
    },
  ],
} as const;

export const reconciliation = {
  // Illustrative mock rows, used by the compact preview in the four-modules
  // section. Generic only: no customers, no statistics.
  rows: [
    { order: 'Order 1041', shipped: '12.4 kg', billed: '12.4 kg', handling: 'Matched', ok: true },
    { order: 'Order 1042', shipped: '3.1 kg', billed: '3.1 kg', handling: 'Matched', ok: true },
    { order: 'Order 1043', shipped: '9.8 kg', billed: '14.2 kg', handling: 'Matched', ok: false, reason: 'Billed weight does not match the shipment' },
    { order: 'Order 1044', shipped: '21.0 kg', billed: '21.0 kg', handling: 'Matched', ok: true },
    { order: 'Order 1045', shipped: '6.7 kg', billed: '6.7 kg', handling: 'Matched', ok: true },
    { order: 'Order 1046', shipped: '15.5 kg', billed: '15.5 kg', handling: 'Matched', ok: true },
  ],
};

export const pricing = {
  title: 'Four tiers, set by warehouse count and order volume.',
  tiers: [
    {
      name: 'Starter',
      warehouses: '1 warehouse',
      orders: 'Up to 500 orders a month',
      includes: ['All 4 core modules', 'Email support'],
      note: 'Most teams here just moved off spreadsheets. Reconciliation alone tends to justify the switch.',
      preset: '1',
    },
    {
      name: 'Growth',
      warehouses: '2 to 5 warehouses',
      orders: 'Up to 5,000 orders a month',
      includes: ['All 4 core modules', 'Priority support'],
      note: 'This is where multi warehouse visibility starts to matter, coordinating across locations without a system built for it.',
      preset: '2-5',
    },
    {
      name: 'Scale',
      warehouses: '6 to 10 warehouses',
      orders: 'Up to 20,000 orders a month',
      includes: ['All 4 core modules', 'Faster support response times', 'Dedicated onboarding specialist for data migration'],
      note: 'Reconciliation catches the most here, simply because there are more invoices to check every day.',
      preset: '6-10',
    },
    {
      name: 'Gold',
      warehouses: '10+ warehouses',
      orders: '20,000+ orders a month',
      includes: ['All 4 core modules', 'Dedicated account manager', 'Custom support tailored to volume'],
      note: 'The most complex carrier mix, and the only tier with a named account manager instead of a support queue.',
      preset: '10+',
    },
  ],
  picker: {
    title: 'Which tier fits?',
    rule: 'Tier is set by whichever number is higher, warehouse count or order volume, not whichever is lower.',
    warehousesLabel: 'Warehouses',
    ordersLabel: 'Orders a month',
  },
};

export const agent = {
  title: 'Ask Flowdeck.',
  body: 'It knows Flowdeck’s four modules in depth, how the tiers work, and what makes running one system different from stitching several together. Ask it anything about Flowdeck.',
  tagline: 'Knows the product. Hands exact pricing to the form.',
  starters: [
    'Which tier fits 3 warehouses and 400 orders a month?',
    'What does billing reconciliation actually check?',
    'How long does onboarding take?',
  ],
  composerPlaceholder: 'Ask about modules, tiers, onboarding',
  demoPlaceholder: 'The agent is switched off in this demo',
  errorText: 'The agent is not reachable right now.',
  formCta: 'Open the quote form',
};

export const quote = {
  title: 'Get a quote.',
  steps: ['About you', 'Your operation', 'Where you are'],
  margin: {
    next: 'Someone from the team follows up directly with real numbers based on the specifics.',
    tierHint: 'Pick warehouses and volume to see the tier that fits.',
  },
  fields: {
    name: 'Name',
    email: 'Work email',
    company: 'Company',
    warehouses: 'How many warehouses?',
    orders: 'Orders a month',
    tooling: 'What are you using today?',
    timeline: 'When are you looking to move?',
  },
  submit: 'Send my details',
  demoSubmit: 'Sending is switched off in this demo',
  error: 'Could not send. Try again.',
};

export const faq = [
  {
    q: 'How long does onboarding take?',
    a: 'Most teams are live within two to three weeks, including migrating existing data from spreadsheets or another platform. Scale and Gold customers get a dedicated onboarding specialist for this.',
  },
  {
    q: 'Is my data secure?',
    a: 'Flowdeck is SOC 2 Type II compliant, with data encrypted at rest and in transit. Scale and Gold plans include a 99.9 percent uptime SLA.',
  },
  {
    q: 'Can I see exact pricing without talking to sales?',
    a: 'Not published pricing, no. Warehouse count, order volume, and which modules matter most all affect the plan, so the accurate way to get a number is the contact form. It takes a minute and someone follows up with real figures for your setup.',
  },
  {
    q: 'Is there a contract or can I cancel anytime?',
    a: 'Starter and Growth are billed monthly or annually with no long term lock in. Scale and Gold typically run on an annual commitment, reflecting the dedicated support that comes with those tiers.',
  },
];

export const footer = {
  line: 'Operations software for logistics and 3PL companies.',
  origin: 'Founded 2023 in Bengaluru.',
};
