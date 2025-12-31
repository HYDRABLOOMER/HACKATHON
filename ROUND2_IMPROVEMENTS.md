# EcoQuest – Round 2 Improvements Plan

This document outlines the **planned improvements for Round 2**, building directly on the system demonstrated in Round 1.

The Round 1 prototype focuses on proving a complete, coherent data flow:
citizen action → verification → storage → aggregation → feedback.

Round 2 enhancements aim to **strengthen data credibility, expand institutional usability, and improve analytical depth**, without changing the core system architecture.


## 1. Replace Simulated Verification with Real AI Models

### Current (Round 1)
- Image verification is simulated or rule-based
- Manual approval is represented conceptually

### Improvement (Round 2)
- Integrate real computer vision models (e.g., YOLO / MobileNet)
- Detect environmental objects such as:
  - Trash and waste
  - Trees and plants
  - Water bodies and pollution indicators
- Use AI as a first-pass filter before manual review

### Value
- Improves scalability of verification
- Reduces moderator workload
- Increases trust in generated data


## 2. Institutional Dashboards (NGO / Authority View)

### Current (Round 1)
- Aggregation visible mainly through user-facing leaderboards

### Improvement (Round 2)
- Dedicated dashboards for NGOs and institutions showing:
  - Verified actions by category and location
  - Repeated issue hotspots
  - Participation trends over time
- Exportable summaries for reporting and planning

### Value
- Converts raw participation data into decision-support tools
- Makes EcoQuest useful beyond user engagement


## 3. Credibility & Trust Scoring for Users

### Current (Round 1)
- All verified actions contribute equally

### Improvement (Round 2)
- Introduce a user credibility score based on:
  - History of verified submissions
  - Knowledge-based performance
  - Consistency of participation
- Weight data contributions by credibility score

### Value
- Further improves data reliability
- Discourages low-effort or spam participation
- Enables differentiated access to higher-impact tasks


## 4. Advanced Aggregation & Hotspot Analytics

### Current (Round 1)
- Basic aggregation (counts, leaderboards)

### Improvement (Round 2)
- Time-series analysis of actions and reports
- Automatic detection of:
  - Persistent problem areas
  - High-impact intervention zones
- Visual hotspot maps with temporal trends

### Value
- Enables proactive, data-driven interventions
- Moves system from descriptive to analytical


## 5. Expansion of Public Reporting System

### Current (Round 1)
- Basic report submission and status tracking

### Improvement (Round 2)
- Category-specific routing to relevant authorities
- SLA-based status tracking (time-to-resolution)
- Report quality feedback loop to reporters

### Value
- Improves accountability
- Makes reporting data operationally useful


## 6. Civic Feedback & Sentiment Dashboards

### Current (Round 1)
- Opinion and sentiment features are scoped conceptually

### Improvement (Round 2)
- AI-based sentiment aggregation
- Issue-wise public priority scoring
- Location-based sentiment overlays with action data

### Value
- Adds qualitative context to quantitative data
- Helps institutions understand public perception alongside ground reality


## 7. Mobile Application for Participation Density

### Current (Round 1)
- Web-based prototype

### Improvement (Round 2)
- Mobile app (React Native / Flutter)
- Push notifications for:
  - Nearby tasks
  - Reporting follow-ups
  - Knowledge updates

### Value
- Increases participation frequency
- Improves real-time data collection


## 8. Why These Improvements Matter

All Round 2 improvements:
- Build directly on the Round 1 architecture
- Do not require redesigning the core data flow
- Strengthen verification, analytics, and institutional usability

The focus remains consistent:
> **Transform citizen participation into reliable, scalable environmental intelligence.**


