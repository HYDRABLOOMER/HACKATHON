# EcoQuest Architecture

## System Flowchart

```mermaid
flowchart LR
    %% External Actors
    User[👤 User]
    NGO[🏛 NGO / Authority]

    %% Frontend
    subgraph FE["Frontend Layer"]
        Web[🌐 Web App (React)]
        Mobile[📱 Mobile App (Future)]
    end

    %% Backend
    subgraph BE["Backend Layer"]
        API[🔗 API Gateway]
        TaskSvc[🧹 Task Service]
        ReportSvc[📍 Reporting Service]
        KnowledgeSvc[📚 Knowledge Service]
        ScoreSvc[🏆 Scoring Service]
    end

    %% AI Services
    subgraph AI["AI / Python Services"]
        VerifyAI[🛡 Image Verification]
        FraudAI[🚫 Anti-Fraud]
        CredAI[📈 Credibility Scoring]
        AnalyticsAI[📊 Pattern Detection]
    end

    %% Data Layer
    subgraph DATA["Data Layer"]
        DB[(PostgreSQL / MongoDB)]
        Storage[(Image Storage)]
        Cache[(Redis Cache)]
    end

    %% User Flow
    User --> Web
    User --> Mobile
    Web --> API
    Mobile --> API

    %% NGO Flow
    NGO --> Web
    Web --> API

    %% Backend Routing
    API --> TaskSvc
    API --> ReportSvc
    API --> KnowledgeSvc
    API --> ScoreSvc

    %% AI Calls
    TaskSvc --> VerifyAI
    TaskSvc --> FraudAI
    ScoreSvc --> CredAI
    ReportSvc --> AnalyticsAI

    %% Data Access
    TaskSvc --> DB
    ReportSvc --> DB
    KnowledgeSvc --> DB
    ScoreSvc --> DB
    VerifyAI --> DB
    AnalyticsAI --> DB

    %% Media & Cache
    TaskSvc --> Storage
    ReportSvc --> Storage
    ScoreSvc --> Cache

    %% Outputs
    API --> Web
    API --> Mobile
    API --> NGO
```