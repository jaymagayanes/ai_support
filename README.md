# AI Support Operations Demo
**Zendesk-Style Ticket Automation & Workflow System**

This project is my attempt at building a practical AI-assisted support operations workflow inspired by platforms like Zendesk and Salesforce.

Instead of focusing on "hype AI," I wanted to explore how automation can realistically help support teams reduce repetitive work, improve response times, and organize operations more efficiently.

The system classifies incoming tickets, generates summaries for agents, suggests responses, routes issues to the correct queue, and simulates CRM synchronization — all within a lightweight full-stack environment.

## 🎯 Why I Built This

I wanted to demonstrate how AI can be integrated into real operational workflows without overengineering everything or relying entirely on expensive external APIs.

A lot of support operations still involve repetitive manual tasks:

- Reading long tickets
- Categorizing requests
- Routing issues manually
- Writing the same responses repeatedly
- Syncing records between systems

This project automates those repetitive layers while still keeping humans in control of final decisions.

The goal was not to replace agents — it was to reduce friction so agents can spend more time solving actual problems.

## ✨ What This Project Demonstrates

### 1. Rule-Based AI Classification

Instead of connecting directly to an LLM, I built a deterministic rule engine that classifies support tickets based on keywords and routing logic.

I intentionally chose this approach because:

- It's cheaper to run
- Easier to maintain
- Predictable and testable
- Doesn't break if third-party AI services go down

This demonstrates how lightweight automation can sometimes outperform "heavy AI" depending on the use case.

### 2. API & Integration Design

I structured the backend around REST-style integrations similar to the kinds of systems used in support operations environments.

The project includes:

- Clean API endpoint structure
- Webhook-style architecture
- JSON-based data transformation
- Simulated CRM synchronization
- Error handling patterns
- Modular workflow design

The idea was to mimic how systems like Zendesk and Salesforce communicate internally across operational pipelines.

### 3. Workflow Automation

The project automates the lifecycle of a support ticket from intake to routing.

That includes:

- Ticket creation
- AI-based classification
- Priority assignment
- SLA calculation
- Duplicate detection
- Auto-generated summaries
- Suggested responses
- CRM synchronization

I wanted the workflow to feel similar to a real support operations environment instead of just being a simple CRUD app.

### 4. Frontend + Backend Integration

I built multiple interfaces to simulate different user perspectives within the same operational ecosystem:

- Customer support portal
- Agent dashboard
- Administrative analytics dashboard

This helped me demonstrate both backend logic and frontend integration in one project.

## 🚀 Running the Project

The project is fully self-contained and can run locally without external API credentials.

**Quick Start:**

```bash
# Clone the repository
git clone https://github.com/jaymagayanes/ai_support

# Open the project
cd ai_support

# Install dependencies
npm install

# Run the server
node index.js
```

Server runs on: http://localhost:3000

## 🖥️ Available Interfaces

**Customer Portal**
http://localhost:3000/portal.html

**Agent Dashboard**
http://localhost:3000/agent-dashboard.html

**Admin Dashboard**
http://localhost:3000/dashboard.html

## 📋 API Endpoints

**Create Ticket**
`POST /tickets/create`

Example body:
```json
{
  "school_name": "Lincoln High School",
  "issue_type": "Technical Issue",
  "subject": "Cannot access student portal",
  "description": "Student unable to login to the system",
  "priority_override": "High"
}
```

**Get All Tickets**
`GET /tickets/list`

Returns all stored tickets.

**Check Duplicate Tickets**
`POST /tickets/check-duplicate`

Example body:
```json
{
  "school_name": "Lincoln High School",
  "description": "Student unable to access portal"
}
```

**Generate Ticket Summary**
`GET /tickets/{ticket_id}/summary`

**Generate Suggested Response**
`GET /tickets/{ticket_id}/suggest-response`

**CRM Sync**
`POST /crm/sync/{ticket_id}`

Simulates syncing ticket data into a Salesforce-style CRM structure.

## 🏗️ System Architecture

I designed the application around four independent modules.

This keeps the project modular, easier to maintain, and closer to how real operational systems are structured.

**Module 1 — Classification & Routing**

Responsible for:

- Ticket categorization
- Priority detection
- Queue assignment
- SLA calculation

The classifier uses rule-based matching on ticket keywords.

This module could later be swapped with a real LLM without affecting downstream workflows.

**Module 2 — Summarization**

Generates short agent-friendly ticket summaries.

Instead of forcing agents to read large descriptions immediately, the system creates a quick operational briefing using ticket metadata.

**Module 3 — Response Suggestions**

Suggests pre-written responses depending on ticket category.

Agents can:

- Use the response directly
- Edit it
- Ignore it completely

The goal here is simply reducing repetitive typing.

**Module 4 — CRM Sync**

Transforms ticket data into a CRM-style structure for downstream systems.

Currently this writes into local JSON storage, but the architecture is designed so it could later connect to:

- Salesforce APIs
- Zendesk APIs
- External webhook systems
- Database layers

## 📁 Project Structure

```
ai-support/
├── index.js
├── package.json
├── public/
│   ├── portal.html
│   ├── agent-dashboard.html
│   └── dashboard.html
├── data/
│   ├── tickets.json
│   └── crm_records.json
├── logs/
│   ├── automation.json
│   ├── audit.json
│   └── webhooks.json
└── README.md
```

## 🎓 Ticket Categories & SLA Logic

| Category | Priority | Queue | SLA |
|----------|----------|-------|-----|
| Technical Issue | High | technical_support | 2h |
| Billing | Medium | finance_team | 4h |
| Results Inquiry | Medium | school_support | 6h |
| Candidate Registration | Medium | registration_team | 8h |
| General Inquiry | Low | general_support | 24h |

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


**Author**: [Jay Magayanes](https://github.com/jaymagayanes)  

