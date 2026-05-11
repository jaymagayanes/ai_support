// ============================================
// SUPPORT OPERATIONS PORTAL - MAIN SERVER
// ============================================

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.static('public'));

// ============================================
// AI CLASSIFICATION ENGINE (Rule-based)
// ============================================

function classifyTicket(description, schoolName) {
  description = description.toLowerCase();

  if (
    description.includes('cannot access') ||
    description.includes('portal') ||
    description.includes('login') ||
    description.includes('password') ||
    description.includes('system down')
  ) {
    return {
      category: 'Technical Issue',
      priority: 'High',
      queue: 'technical_support',
      sla_hours: 2,
    };
  }

  if (
    description.includes('charge') ||
    description.includes('bill') ||
    description.includes('payment') ||
    description.includes('invoice')
  ) {
    return {
      category: 'Billing',
      priority: 'Medium',
      queue: 'finance_team',
      sla_hours: 4,
    };
  }

  if (
    description.includes('exam') ||
    description.includes('result') ||
    description.includes('grade') ||
    description.includes('score')
  ) {
    return {
      category: 'Results Inquiry',
      priority: 'Medium',
      queue: 'school_support',
      sla_hours: 6,
    };
  }

  if (
    description.includes('register') ||
    description.includes('candidate') ||
    description.includes('enrol')
  ) {
    return {
      category: 'Candidate Registration',
      priority: 'Medium',
      queue: 'registration_team',
      sla_hours: 8,
    };
  }

  return {
    category: 'General Inquiry',
    priority: 'Low',
    queue: 'general_support',
    sla_hours: 24,
  };
}

// ============================================
// MODULE 2 — AI TICKET SUMMARIZATION
// ============================================
// This function reads a ticket and generates a plain-English summary
// showing the agent what the issue is about in 10 seconds

function summarizeTicket(ticket) {
  const category = ticket.ai_category || ticket.issue_type || 'General';
  const priority = ticket.final_priority || ticket.ai_priority || 'Medium';
  const school = ticket.school_name || 'Unknown school';

  // If the ticket has multi-message history, summarize the thread
  if (ticket.messages && ticket.messages.length > 1) {
    const msgCount = ticket.messages.length;
    const lastMsg = ticket.messages[ticket.messages.length - 1];
    const lastSender = lastMsg.sender === 'agent' ? 'agent' : 'school';
    const snippet =
      lastMsg.text.length > 80
        ? lastMsg.text.substring(0, 80) + '...'
        : lastMsg.text;
    const escalationNote = ticket.escalation_reason
      ? ` ⚠ ESCALATED: ${ticket.escalation_reason}.`
      : '';
    return `${school} has a ${msgCount}-message ${category} thread (${priority} priority).${escalationNote} Latest from ${lastSender}: "${snippet}" — Routed to ${
      ticket.ai_queue || 'support'
    } queue. SLA: ${ticket.sla_hours || 24} hours.`;
  }

  // Single-message fallback (original behaviour)
  const desc = ticket.description || '';
  const shortDesc = desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
  return `${school} submitted a ${category} ticket (${priority} priority). Issue: "${shortDesc}" — Routed to ${
    ticket.ai_queue || 'support'
  } queue. SLA: ${ticket.sla_hours || 24} hours.`;
}

// ============================================
// MODULE 3 — AI SUGGESTED RESPONSES
// ============================================
// This function generates a templated response based on the ticket category
// Agents can send as-is or customize

function suggestResponse(ticket) {
  const category = ticket.ai_category || '';
  const school = ticket.school_name || 'your school';

  const templates = {
    'Technical Issue': `Dear ${school},\n\nThank you for contacting us. We have received your technical support request and our team is investigating urgently.\n\nExpected resolution: ${
      ticket.sla_hours || 2
    } hours.\n\nWe will keep you updated. Please do not submit duplicate tickets.\n\nBest regards,\nSupport Team`,

    Billing: `Dear ${school},\n\nThank you for reaching out regarding your billing concern. Our finance team has been notified and will review your account within ${
      ticket.sla_hours || 4
    } hours.\n\nIf this is urgent, please reference ticket ID: ${
      ticket.ticket_id
    }.\n\nBest regards,\nFinance Support Team`,

    'Results Inquiry': `Dear ${school},\n\nWe have received your results inquiry. Our school support team will review the details and respond within ${
      ticket.sla_hours || 6
    } hours.\n\nPlease ensure all candidate details are included for faster resolution.\n\nBest regards,\nSchool Support Team`,

    'Candidate Registration': `Dear ${school},\n\nYour registration query has been logged. Our registration team will process this within ${
      ticket.sla_hours || 8
    } hours.\n\nPlease have candidate IDs ready when we contact you.\n\nBest regards,\nRegistration Team`,

    'General Inquiry': `Dear ${school},\n\nThank you for contacting us. A member of our support team will review your inquiry and respond within ${
      ticket.sla_hours || 24
    } hours.\n\nBest regards,\nCustomer Support`,
  };

  return templates[category] || templates['General Inquiry'];
}

// ============================================
// MODULE 4 — SALESFORCE CRM SYNC
// ============================================
// This transforms our internal ticket data into Salesforce field format
// KEY CONCEPT: Payload transformation for external APIs

function transformToSalesforce(ticket) {
  return {
    accountName: ticket.school_name,
    caseNumber: ticket.ticket_id,
    caseOrigin: 'Support Portal',
    subject: ticket.subject || ticket.ai_category || ticket.issue_type,
    priority: ticket.final_priority,
    status: ticket.status === 'open' ? 'New' : 'In Progress',
    description__c: ticket.description,
    aiClassification__c: ticket.ai_category,
    aiSummary__c: summarizeTicket(ticket),
    slaDeadline__c: ticket.sla_deadline,
    queueName__c: ticket.ai_queue,
    createdDate: ticket.submitted_at,
  };
}

// ============================================
// HELPER: Ensure data directories exist
// ============================================

function ensureDataDirs() {
  const dirs = [path.join(__dirname, 'data'), path.join(__dirname, 'logs')];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureDataDirs();

// ============================================
// !! IMPORTANT: ALL ROUTES DEFINED BEFORE LISTEN !!
// ============================================

// ============================================
// API ENDPOINT: Create Ticket
// ============================================

app.post('/tickets/create', (request, response) => {
  try {
    const { school_name, issue_type, subject, priority_override, description } =
      request.body;

    if (!school_name || !description) {
      return response.status(400).json({
        success: false,
        error: 'School name and description required',
      });
    }

    const ticket_id = 'TKT-' + Date.now();
    const aiClassification = classifyTicket(description, school_name);
    const finalPriority = priority_override || aiClassification.priority;

    const submitted_at = new Date().toISOString();
    const sla_deadline = new Date(
      Date.now() + aiClassification.sla_hours * 60 * 60 * 1000
    ).toISOString();

    const ticket = {
      ticket_id,
      school_name,
      subject: subject || issue_type || 'No subject provided',
      issue_type,
      description,
      ai_category: aiClassification.category,
      ai_priority: aiClassification.priority,
      ai_queue: aiClassification.queue,
      final_priority: finalPriority,
      sla_hours: aiClassification.sla_hours,
      sla_deadline,
      status: 'open',
      submitted_at,
      agent_assigned: null,
      summary: null,
      resolution: null,
    };

    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    let tickets = [];

    if (fs.existsSync(ticketsFilePath)) {
      const fileContent = fs.readFileSync(ticketsFilePath, 'utf-8');
      tickets = JSON.parse(fileContent);
    }

    tickets.push(ticket);
    fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2));

    const logsFilePath = path.join(__dirname, 'logs', 'automation.json');
    let logs = [];

    if (fs.existsSync(logsFilePath)) {
      const fileContent = fs.readFileSync(logsFilePath, 'utf-8');
      logs = JSON.parse(fileContent);
    }

    logs.push({
      timestamp: new Date().toISOString(),
      action: 'ticket_created',
      ticket_id,
      ai_classification: aiClassification.category,
      routed_to: aiClassification.queue,
      sla_hours: aiClassification.sla_hours,
    });

    fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));

    response.status(201).json({
      success: true,
      ticket_id,
      message: `Ticket created and routed to ${aiClassification.queue}`,
      ai_insights: {
        category: aiClassification.category,
        priority: finalPriority,
        queue: aiClassification.queue,
        sla_hours: aiClassification.sla_hours,
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    response.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
    });
  }
});

// ============================================
// API ENDPOINT: Get All Tickets
// ============================================

app.get('/tickets/list', (request, response) => {
  try {
    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');

    if (!fs.existsSync(ticketsFilePath)) {
      return response.json([]);
    }

    const fileContent = fs.readFileSync(ticketsFilePath, 'utf-8');
    const tickets = JSON.parse(fileContent);
    response.json(tickets);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// ============================================
//  DUPLICATE TICKET DETECTION
// ============================================
// Before creating a ticket, check if a similar one
// already exists from the same school in the last 24h.
// This is a common automation pattern in Zendesk.

app.post('/tickets/check-duplicate', (request, response) => {
  try {
    const { school_name, description } = request.body;
    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');

    if (!fs.existsSync(ticketsFilePath)) {
      return response.json({ duplicate: false });
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h ago

    // Simple similarity: same school + first 40 chars of description match
    const snippet = description.trim().toLowerCase().substring(0, 40);

    const match = tickets.find(
      (t) =>
        t.school_name === school_name &&
        t.status === 'open' &&
        new Date(t.submitted_at).getTime() > cutoff &&
        t.description.toLowerCase().substring(0, 40) === snippet
    );

    response.json({
      duplicate: !!match,
      existing_ticket_id: match ? match.ticket_id : null,
      message: match
        ? `Similar open ticket already exists: ${match.ticket_id}`
        : 'No duplicate detected',
    });
  } catch (error) {
    response.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// API ENDPOINT: Get Ticket Summary (MODULE 2)
// THIS IS THE KEY ROUTE FOR MODULE 2
// ============================================

app.get('/tickets/:id/summary', (request, response) => {
  try {
    const { id } = request.params;
    console.log(`[Module 2] Fetching summary for ticket: ${id}`);

    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    if (!fs.existsSync(ticketsFilePath)) {
      return response.status(404).json({
        success: false,
        error: 'No tickets found',
      });
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const ticket = tickets.find((t) => t.ticket_id === id);

    if (!ticket) {
      return response.status(404).json({
        success: false,
        error: `Ticket ${id} not found`,
      });
    }

    // GENERATE THE SUMMARY USING MODULE 2 FUNCTION
    const summary = summarizeTicket(ticket);

    response.json({
      success: true,
      ticket_id: id,
      summary: summary,
      category: ticket.ai_category,
      priority: ticket.final_priority,
      school: ticket.school_name,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// API ENDPOINT: Get Suggested Response (MODULE 3)
// ============================================

app.get('/tickets/:id/suggest-response', (request, response) => {
  try {
    const { id } = request.params;
    console.log(`[Module 3] Generating response for ticket: ${id}`);

    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    if (!fs.existsSync(ticketsFilePath)) {
      return response.status(404).json({
        success: false,
        error: 'No tickets found',
      });
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const ticket = tickets.find((t) => t.ticket_id === id);

    if (!ticket) {
      return response.status(404).json({
        success: false,
        error: `Ticket ${id} not found`,
      });
    }

    // GENERATE THE SUGGESTED RESPONSE USING MODULE 3 FUNCTION
    const suggestedText = suggestResponse(ticket);

    response.json({
      success: true,
      ticket_id: id,
      suggested_response: suggestedText,
      based_on_category: ticket.ai_category,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating response:', error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// API ENDPOINT: Sync to Salesforce CRM (MODULE 4)
// ============================================

app.post('/crm/sync/:id', (request, response) => {
  try {
    const { id } = request.params;
    console.log(`[Module 4] Syncing ticket ${id} to Salesforce`);

    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    if (!fs.existsSync(ticketsFilePath)) {
      return response.status(404).json({
        success: false,
        error: 'No tickets found',
      });
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const ticket = tickets.find((t) => t.ticket_id === id);

    if (!ticket) {
      return response.status(404).json({
        success: false,
        error: `Ticket ${id} not found`,
      });
    }

    const original = {
      school_name: ticket.school_name,
      ticket_id: ticket.ticket_id,
    };
    const salesforcePayload = transformToSalesforce(ticket);

    const crmFilePath = path.join(__dirname, 'data', 'crm_records.json');
    let records = [];
    if (fs.existsSync(crmFilePath)) {
      records = JSON.parse(fs.readFileSync(crmFilePath, 'utf-8'));
    }

    const existingIndex = records.findIndex((r) => r.caseNumber === id);
    if (existingIndex >= 0) {
      records[existingIndex] = salesforcePayload;
    } else {
      records.push(salesforcePayload);
    }
    fs.writeFileSync(crmFilePath, JSON.stringify(records, null, 2));

    response.json({
      success: true,
      message: 'CRM record synced successfully',
      salesforce_payload: salesforcePayload,
      sync_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/crm/records', (request, response) => {
  try {
    const crmFilePath = path.join(__dirname, 'data', 'crm_records.json');
    if (!fs.existsSync(crmFilePath)) return response.json([]);
    const records = JSON.parse(fs.readFileSync(crmFilePath, 'utf-8'));
    response.json(records);
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// API ENDPOINT: Get Dashboard Stats (MODULE 5)
// ============================================

app.get('/dashboard/stats', (request, response) => {
  try {
    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    if (!fs.existsSync(ticketsFilePath)) {
      return response.json({
        total: 0,
        open: 0,
        urgent: 0,
        breached: 0,
        byCategory: {},
      });
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const now = new Date();

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      urgent: tickets.filter((t) => t.final_priority === 'Urgent').length,
      breached: tickets.filter(
        (t) => new Date(t.sla_deadline) < now && t.status === 'open'
      ).length,
      byCategory: {},
    };

    tickets.forEach((t) => {
      const cat = t.ai_category || 'Unknown';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });

    response.json(stats);
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// AUDIT & WEBHOOK LOG ENDPOINTS
// ============================================

app.get('/logs/audit', (request, response) => {
  try {
    const auditPath = path.join(__dirname, 'logs', 'audit.json');
    if (!fs.existsSync(auditPath)) return response.json([]);
    response.json(JSON.parse(fs.readFileSync(auditPath, 'utf-8')));
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.get('/logs/webhooks', (request, response) => {
  try {
    const webhookPath = path.join(__dirname, 'logs', 'webhooks.json');
    if (!fs.existsSync(webhookPath)) return response.json([]);
    response.json(JSON.parse(fs.readFileSync(webhookPath, 'utf-8')));
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// ============================================
// API ENDPOINT: Get Logs
// ============================================
app.get('/logs', (request, response) => {
  try {
    const logsFilePath = path.join(__dirname, 'logs', 'automation.json');

    if (!fs.existsSync(logsFilePath)) {
      return response.json([]);
    }

    const fileContent = fs.readFileSync(logsFilePath, 'utf-8');
    const logs = JSON.parse(fileContent);
    response.json(logs);
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agent-dashboard.html'));
});

app.get('/agent-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agent-dashboard.html'));
});

// ============================================
//  MULTI-MESSAGE CONVERSATIONS
// ============================================
// Real Zendesk tickets support threaded replies.
// This simulates that: each ticket now has a messages[]
// array that grows with each customer or agent reply.

app.post('/tickets/:id/reply', (request, response) => {
  try {
    const { id } = request.params;
    const { sender, text } = request.body;

    if (!sender || !text) {
      return response.status(400).json({
        success: false,
        error: 'sender and text are required',
      });
    }

    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const idx = tickets.findIndex((t) => t.ticket_id === id);

    if (idx === -1) {
      return response
        .status(404)
        .json({ success: false, error: 'Ticket not found' });
    }

    // Initialize messages array if this ticket predates the feature
    if (!tickets[idx].messages) {
      tickets[idx].messages = [
        {
          sender: 'school',
          text: tickets[idx].description,
          timestamp: tickets[idx].submitted_at,
        },
      ];
    }

    const newMessage = {
      sender, // 'school' or 'agent'
      text,
      timestamp: new Date().toISOString(),
    };

    tickets[idx].messages.push(newMessage);
    tickets[idx].last_updated = new Date().toISOString();

    // ── Escalation Detection ──────────────────────────
    // MODULE 6: Scan new message for escalation signals.
    // Mirrors how real AI routing engines flag hot keywords.
    const escalationKeywords = [
      'urgent',
      'escalate',
      'manager',
      'unacceptable',
      'still not working',
      'hours ago',
      'days ago',
      'lawsuit',
      'complaint',
      'refund',
      'data loss',
    ];
    const lowerText = text.toLowerCase();
    const triggered = escalationKeywords.filter((k) => lowerText.includes(k));

    if (triggered.length > 0 && tickets[idx].final_priority !== 'Urgent') {
      tickets[idx].final_priority = 'Urgent';
      tickets[
        idx
      ].escalation_reason = `Auto-escalated: keywords detected → [${triggered.join(
        ', '
      )}]`;
      tickets[idx].escalated_at = new Date().toISOString();
    }

    fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2));

    // ── Audit Trail ───────────────────────────────────
    // MODULE 7: Every mutation is logged for compliance.
    // Privacy-by-design: we log who acted, not what they said.
    const auditPath = path.join(__dirname, 'logs', 'audit.json');
    let audit = [];
    if (fs.existsSync(auditPath)) {
      audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    }
    audit.push({
      timestamp: new Date().toISOString(),
      action: 'reply_added',
      ticket_id: id,
      actor: sender,
      escalated: triggered.length > 0,
    });
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));

    // ── Outbound Webhook Simulation ───────────────────
    // MODULE 8: In real integrations, events fire webhooks
    // to notify downstream systems (Salesforce, Slack, etc.)
    // We simulate this by logging the payload that WOULD be sent.
    const webhookPath = path.join(__dirname, 'logs', 'webhooks.json');
    let webhooks = [];
    if (fs.existsSync(webhookPath)) {
      webhooks = JSON.parse(fs.readFileSync(webhookPath, 'utf-8'));
    }
    webhooks.push({
      timestamp: new Date().toISOString(),
      event: 'ticket.reply_received',
      target_url: 'https://hooks.salesforce.com/simulate/zendesk-events',
      status: 'delivered', // simulated
      payload: {
        ticket_id: id,
        sender,
        escalated: triggered.length > 0,
        message_count: tickets[idx].messages.length,
      },
    });
    fs.writeFileSync(webhookPath, JSON.stringify(webhooks, null, 2));

    response.json({
      success: true,
      message: 'Reply added',
      escalated: triggered.length > 0,
      escalation_reason: tickets[idx].escalation_reason || null,
      message_count: tickets[idx].messages.length,
    });
  } catch (error) {
    response.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MODULE 6 — GET CONVERSATION THREAD
// ============================================

app.get('/tickets/:id/messages', (request, response) => {
  try {
    const { id } = request.params;
    const ticketsFilePath = path.join(__dirname, 'data', 'tickets.json');
    const tickets = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
    const ticket = tickets.find((t) => t.ticket_id === id);

    if (!ticket) {
      return response
        .status(404)
        .json({ success: false, error: 'Ticket not found' });
    }

    const messages = ticket.messages || [
      {
        sender: 'school',
        text: ticket.description,
        timestamp: ticket.submitted_at,
      },
    ];

    response.json({
      success: true,
      ticket_id: id,
      school: ticket.school_name,
      message_count: messages.length,
      escalated: ticket.final_priority === 'Urgent',
      escalation_reason: ticket.escalation_reason || null,
      messages,
    });
  } catch (error) {
    response.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MODULE 8 — CRM SYNC WITH RETRY SIMULATION
// ============================================
// Real integrations need retry logic when external APIs fail.
// This endpoint simulates a flaky upstream and retries up to 3x.

app.post('/crm/sync-with-retry/:id', async (request, response) => {
  const { id } = request.params;
  const MAX_RETRIES = 3;
  let attempt = 0;
  let lastError = null;

  // Simulate an unreliable external API: fails ~40% of the time
  function simulateExternalCRMCall() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.4) {
          reject(new Error('Upstream CRM timeout (simulated)'));
        } else {
          resolve({ crm_id: 'SF-' + Date.now() });
        }
      }, 300);
    });
  }

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const result = await simulateExternalCRMCall();

      // Log successful sync
      const webhookPath = path.join(__dirname, 'logs', 'webhooks.json');
      let webhooks = [];
      if (fs.existsSync(webhookPath)) {
        webhooks = JSON.parse(fs.readFileSync(webhookPath, 'utf-8'));
      }
      webhooks.push({
        timestamp: new Date().toISOString(),
        event: 'crm.sync_success',
        ticket_id: id,
        attempts: attempt,
        crm_id: result.crm_id,
      });
      fs.writeFileSync(webhookPath, JSON.stringify(webhooks, null, 2));

      return response.json({
        success: true,
        ticket_id: id,
        crm_id: result.crm_id,
        attempts_needed: attempt,
        message: `Synced on attempt ${attempt} of ${MAX_RETRIES}`,
      });
    } catch (err) {
      lastError = err.message;
      // Exponential backoff simulation (logged, not actually waited in full)
      console.log(`[CRM Retry] Attempt ${attempt} failed: ${err.message}`);
    }
  }

  // All retries exhausted — this is the fallback
  response.status(502).json({
    success: false,
    ticket_id: id,
    attempts_made: MAX_RETRIES,
    error: `All ${MAX_RETRIES} attempts failed. Last error: ${lastError}`,
    fallback_action: 'Ticket queued for manual CRM sync review',
  });
});

// ============================================
// START SERVER (ALL ROUTES MUST BE DEFINED ABOVE THIS)
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 ============================================`);
  console.log(`✅ Support Operations Portal running on port ${PORT}`);
  console.log(`============================================`);
  console.log(`📝 Submit tickets at: http://localhost:${PORT}`);
  console.log(`📊 View agent dashboard at: http://localhost:${PORT}/dashboard`);
  console.log(`📋 View all tickets at: http://localhost:${PORT}/tickets/list`);
  console.log(`📋 View logs at: http://localhost:${PORT}/logs`);
  console.log(`🚀 ============================================\n`);
});
