# AI Sample Project: Zendesk | Operations 

A demonstration of how artificial intelligence can be embedded directly into customer support operations to reduce repetitive manual work and accelerate response times.

## 🎯 Project Goal

This project showcases a practical approach to AI-powered support automation: **classify incoming tickets intelligently, auto-generate summaries for agents, and suggest contextual responses** — all integrated into a real support workflow environment.

The intent is to demonstrate how modern CX platforms (Zendesk, Salesforce) can leverage AI outputs to improve agent productivity without replacing human judgment.

## ✨ What This Project Demonstrates

### 1. **Rule-Based AI Classification (No LLM Dependency)**
Instead of relying on external AI APIs, this uses deterministic rule engines to categorize tickets. This shows understanding of:
- Cost-effective automation strategies
- When lightweight logic outperforms heavy AI
- Designing systems that gracefully degrade without third-party services

### 2. **API & Integration Design**
Built with REST principles in mind, the system models the kind of integrations Jay works on daily:
- Clean endpoint design for third-party integration
- Webhook-ready architecture
- Data transformation for downstream systems (Salesforce sync)
- Proper error handling and response schemas

### 3. **Workflow Automation**
Shows how to automate the end-to-end support lifecycle:
- Ticket intake and intelligent routing
- Auto-generated agent briefings (summarization module)
- Pre-written response suggestions (templating engine)
- Duplicate detection to prevent manual redundancy

### 4. **Data Pipeline & Transformation**
Demonstrates practical skills in:
- JSON data manipulation
- File-based persistence
- Log aggregation and audit trails
- CRM data mapping and sync patterns

### 5. **Frontend-Backend Integration**
Three distinct interfaces showing full-stack thinking:
- Customer-facing portal
- Agent-facing dashboard
- Administrative analytics view

## 🚀 Running the Demo

This project is fully self-contained and ready to run locally without external API credentials.

### Quick Start

```bash
# 1. Clone or extract the repository
git clone https://github.com/jaymagayanes/ai_support
cd ai_support

# 2. Install dependencies
npm install

# 3. Start the server
node index.js

# Server runs on http://localhost:3000
```

### Access the Interfaces

- **Support Portal** (customer-facing): http://localhost:3000/portal.html
- **Agent Dashboard** (internal): http://localhost:3000/agent-dashboard.html  
- **Admin Dashboard** (analytics): http://localhost:3000/dashboard.html

**Note**: The system uses JSON file storage for data persistence. All ticket and automation data is stored locally in the `/data` and `/logs` directories.

## 📋 API Endpoints

### Ticket Management

#### Create Ticket
```http
POST /tickets/create
Content-Type: application/json

{
  "school_name": "Lincoln High School",
  "issue_type": "Technical Issue",
  "subject": "Cannot access student portal",
  "description": "Student unable to login to the system",
  "priority_override": "High"
}
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-1715640000123",
  "message": "Ticket created and routed to technical_support",
  "ai_insights": {
    "category": "Technical Issue",
    "priority": "High",
    "queue": "technical_support",
    "sla_hours": 2
  }
}
```

#### Get All Tickets
```http
GET /tickets/list
```

Returns an array of all tickets with full details.

#### Check for Duplicates
```http
POST /tickets/check-duplicate
Content-Type: application/json

{
  "school_name": "Lincoln High School",
  "description": "Student unable to access portal"
}
```

**Response:**
```json
{
  "duplicate": false,
  "existing_ticket_id": null,
  "message": "No duplicate detected"
}
```

#### Get Ticket Summary
```http
GET /tickets/{ticket_id}/summary
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-1715640000123",
  "summary": "Technical issue from Lincoln High School regarding student portal access. High priority - requires urgent attention.",
  "category": "Technical Issue",
  "priority": "High",
  "school": "Lincoln High School",
  "generated_at": "2024-05-13T12:00:00.000Z"
}
```

#### Get Suggested Response
```http
GET /tickets/{ticket_id}/suggest-response
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-1715640000123",
  "suggested_response": "Thank you for reporting the technical issue. We understand this is affecting your students' access. Our technical team will investigate immediately...",
  "based_on_category": "Technical Issue",
  "generated_at": "2024-05-13T12:00:00.000Z"
}
```

### CRM Integration

#### Sync Ticket to Salesforce
```http
POST /crm/sync/{ticket_id}
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-1715640000123",
  "synced_to_salesforce": true,
  "case_number": "Case-001",
  "timestamp": "2024-05-13T12:00:00.000Z"
}
```

#### Get CRM Records
```http
GET /crm/records
```

Returns all synced CRM records.

## 🏗️ System Architecture

The system is built as four independent modules that work together in a pipeline:

### Module 1: Classification & Routing
**Purpose**: Automatically categorize incoming tickets and assign them to the right team.

**Technical Details**: 
- Rule-based matcher on ticket description keywords
- Returns category, priority, queue assignment, and SLA hours
- Could be replaced with an LLM later without breaking downstream modules

**Real-World Context**: This is how Zendesk routing automations work — matching text patterns to business rules.

### Module 2: Summarization
**Purpose**: Generate a quick brief for support agents — "what is this ticket about in 30 seconds?"

**Technical Details**:
- Extracts key fields from ticket JSON (category, priority, school name)
- Combines them into human-readable narrative
- Called on-demand when agent opens a ticket

**Real-World Context**: Agent dashboards often show auto-generated summaries to reduce reading time on high-volume tickets.

### Module 3: Response Suggestion  
**Purpose**: Suggest a template response based on ticket category, reducing manual typing.

**Technical Details**:
- Maps ticket category to predefined response templates
- Agents can use as-is, edit, or discard
- Shows up in the agent dashboard

**Real-World Context**: Many support platforms (Zendesk, Intercom) now include AI-assisted response suggestions to improve first-response time metrics.

### Module 4: CRM Sync
**Purpose**: Push ticket data to downstream systems (Salesforce) for record-keeping and case management.

**Technical Details**:
- Transforms internal ticket format to Salesforce case format
- Stores synced records in `/data/crm_records.json`
- Could easily connect to real Salesforce REST API

**Real-World Context**: Two-way sync between support platforms and CRM systems is a core integration pattern.

## 📁 Project Structure

```
ai-support/
├── index.js                 # Main server file
├── package.json            # Project dependencies
├── package-lock.json       # Dependency versions
├── public/                 # Frontend files
│   ├── portal.html        # Customer support portal
│   ├── agent-dashboard.html    # Agent management interface
│   └── dashboard.html     # Admin analytics dashboard
├── data/                   # Data storage
│   ├── tickets.json       # Ticket storage
│   └── crm_records.json   # Salesforce CRM records
├── logs/                   # Application logs
│   ├── automation.json    # Automation events log
│   ├── audit.json         # Audit trail
│   └── webhooks.json      # Webhook activity log
└── README.md              # This file
```

## 🎓 Ticket Categories & SLA

| Category | Priority | Queue | SLA Hours |
|----------|----------|-------|-----------|
| Technical Issue | High | technical_support | 2 |
| Billing | Medium | finance_team | 4 |
| Results Inquiry | Medium | school_support | 6 |
| Candidate Registration | Medium | registration_team | 8 |
| General Inquiry | Low | general_support | 24 |

## 📊 Data Models

### Ticket Schema
```json
{
  "ticket_id": "TKT-1715640000123",
  "school_name": "Lincoln High School",
  "subject": "Cannot access portal",
  "issue_type": "Technical Issue",
  "description": "Student unable to login...",
  "ai_category": "Technical Issue",
  "ai_priority": "High",
  "ai_queue": "technical_support",
  "final_priority": "High",
  "sla_hours": 2,
  "sla_deadline": "2024-05-13T14:00:00.000Z",
  "status": "open",
  "submitted_at": "2024-05-13T12:00:00.000Z",
  "agent_assigned": null,
  "summary": null,
  "resolution": null
}
```

### Automation Log Schema
```json
{
  "timestamp": "2024-05-13T12:00:00.000Z",
  "action": "ticket_created",
  "ticket_id": "TKT-1715640000123",
  "ai_classification": "Technical Issue",
  "routed_to": "technical_support",
  "sla_hours": 2
}
```

## 🔧 Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Data Storage**: JSON files (filesystem-based)
- **Frontend**: HTML, CSS, JavaScript
- **Integration Pattern**: REST APIs + Webhook simulation
- **Integration Targets**: Salesforce CRM (data transform), Zendesk (pattern matching)

## 💡 Design Patterns & Technical Decisions

### Why This Architecture?

**Stateless Classification Engine**  
The AI classification module uses deterministic rules rather than ML models. This demonstrates:
- Understanding of cost-benefit tradeoffs (no cloud API costs, no model training overhead)
- Maintainability (easy to modify rules without retraining)
- Reliability (predictable, testable behavior)

**File-Based Persistence**  
Rather than a database, data lives in JSON files. This choice shows:
- Knowledge of when databases add unnecessary complexity
- Ability to design for simplicity in demos/MVPs
- Proper separation of data concerns (tickets, logs, CRM records in separate files)

**Modular Function Design**  
Four distinct modules handle different aspects:
```
Module 1: Classification (route-assignment logic)
Module 2: Summarization (data extraction and synthesis)
Module 3: Response Suggestions (template engine)
Module 4: CRM Sync (data transformation and mapping)
```
This mirrors how real integrations are structured and allows each piece to be tested independently.

**Duplicate Detection Algorithm**  
Before creating a ticket, the system checks for similar open tickets from the same school within 24 hours. This is a real pattern used in Zendesk and other support platforms — preventing noise before it enters the system.

**Logging & Audit Trail**  
Every automation action is logged with metadata (timestamp, ticket_id, classification, routing decision). This demonstrates:
- Awareness of compliance/audit requirements
- Ability to debug integration failures post-hoc
- Understanding that observability is critical for platform health

## 📝 Usage Examples

Here's how the system flows end-to-end:

### Scenario 1: Incoming Ticket → Automatic Classification & Routing

A customer submits: *"The student portal is down and students cannot access their exam results."*

**What happens:**
1. **Classification** (Module 1) detects keywords: "portal", "access", "exam" → assigns:
   - Category: Technical Issue
   - Priority: High  
   - Queue: technical_support
   - SLA: 2 hours

2. **Duplicate Check** searches for similar open tickets from same school in past 24h
   - If found: returns existing ticket ID to prevent duplicate
   - If not found: creates new ticket

3. **Log Entry** records the automation action with timestamp and classification metadata

```bash
curl -X POST http://localhost:3000/tickets/create \
  -H "Content-Type: application/json" \
  -d '{
    "school_name": "Lincoln High School",
    "issue_type": "Technical Issue",
    "subject": "Portal Down - Student Access",
    "description": "Student portal is down and students cannot access their exam results"
  }'
```

### Scenario 2: Agent Opens Ticket → Auto-Generated Summary & Suggested Response

Support agent opens ticket TKT-1715640000123 in the dashboard.

**What the agent sees:**
1. **Auto-Summary** (Module 2): "High priority technical issue from Lincoln High School. Student portal access failure. Requires urgent investigation. SLA: 2 hours."

2. **Suggested Response** (Module 3): A pre-written template customized for Technical Issues:
   > "Thank you for reporting this technical issue. We understand this is affecting your students' access. Our technical team will investigate immediately and aim to have this resolved within 2 hours..."

Agent can edit, approve, and send — cutting response time from 5 minutes to 30 seconds.

```bash
# Get summary
curl http://localhost:3000/tickets/TKT-1715640000123/summary

# Get suggested response
curl http://localhost:3000/tickets/TKT-1715640000123/suggest-response
```

### Scenario 3: Ticket Resolution → Sync to CRM

Once resolved, the ticket is synced to Salesforce for record-keeping and case closure.

```bash
curl -X POST http://localhost:3000/crm/sync/TKT-1715640000123
```

**Data transformation happens automatically:**
- Zendesk ticket format → Salesforce Case format
- Ticket ID → Case Number
- Priority/Category → Case fields
- Timestamps → CRM timestamps

## 📈 Next Steps (If Extended)

Possible enhancements that would demonstrate additional skills:

- **Real LLM Integration**: Replace rule-based classification with OpenAI/Claude API
- **Database Layer**: Migrate from JSON to PostgreSQL with connection pooling
- **Actual Salesforce API**: Connect to real Salesforce instance instead of file storage
- **Async Job Queue**: Add Bull/RabbitMQ for background processing of heavy operations
- **Frontend Frameworks**: Rebuild dashboards with React, add real-time updates with WebSockets
- **Multi-language Support**: Add i18n for international ticket handling
- **Machine Learning Pipeline**: Train classifier on historical ticket data to improve accuracy
- **Unit & Integration Tests**: Add Jest/Mocha test coverage
- **Docker Containerization**: Package as Docker image for easier deployment
- **Webhook Integrations**: Connect to external services via Stripe, Mailchimp, Slack webhooks

## 🔐 Production Considerations

This is a demonstration project. For real-world deployment, you'd need:

- **Authentication**: OAuth2 / JWT for user sessions
- **Input Validation**: Sanitization to prevent injection attacks
- **Rate Limiting**: Prevent abuse of API endpoints
- **HTTPS/TLS**: Encrypted transport for sensitive data
- **CORS Policy**: Restrict cross-origin requests appropriately
- **Error Handling**: Never expose system paths or internal details in error messages
- **Data Privacy**: Encrypt sensitive fields, implement access controls
- **Monitoring**: APM tools to track performance and errors in production

## 🎓 Skills Demonstrated

This project showcases:

| Skill | How Demonstrated |
|-------|------------------|
| **API Design** | RESTful endpoints with proper status codes, request/response schemas |
| **System Integration** | Multi-module architecture showing how systems talk to each other |
| **Data Transformation** | Mapping between ticket format → Salesforce case format |
| **Workflow Automation** | End-to-end ticket lifecycle automation |
| **Problem Solving** | Practical solutions to real support challenges (duplicate detection, routing) |
| **JavaScript/Node.js** | Backend server, Express middleware, file I/O |
| **Frontend Development** | Three distinct UI views (portal, agent dashboard, admin) |
| **Documentation** | Well-commented code, structured README, API examples |
| **Process Thinking** | Designed automation around actual Zendesk/support workflows |

---

## 📝 Notes

This project was built to demonstrate how AI can be **embedded into real customer support workflows** without over-complicating things. The focus is on practical automation over impressive-but-impractical AI.

**Key Insight**: The best integrations solve actual problems for users. This system tries to reduce repetitive work (classification, summarization, response writing) so support agents can focus on cases that actually need human judgment.

---

**Version**: 1.0 Portfolio Edition  
**Built**: 2024  
**Author**: [Jay Magayanes](https://github.com/jaymagayanes)  
**Repository**: https://github.com/jaymagayanes/ai_support
