# EcoQuest – Round 2 Improvements Plan

This document describes the improvements in what was implemented and demonstrated during the previous round.

The primary objective of the Round 1 prototype was not scale or advanced intelligence, but to validate a complete and working data pipeline:
citizen action → verification → storage → aggregation → feedback.

Now , we are focusing on strengthning credibility ,analytical depth and institution usability, while deliberately preserving the core architecture validated in previous round. 

##1. Replace Simulated Verification with Real AI Models

###Current (Round 1)
- Image verification is simulated or rule-based
- Manual approval is represented conceptually

### Improvement (Round 2)
Round 2 will integrate real computer vision models such as YOLO or MobileNet to perform first-level image analysis. These models will be used to identify environmental elements including:

-Trash and unmanaged waste

-Trees and vegetation

-Water bodies and visible pollution indicators

AI-based verification will act strictly as a pre-screening layer, with final approval still reserved for moderators where required.

### Value
- Improves scalability of verification
- Reduces moderator workload
- Increases trust in generated data


## 2. Institutional Dashboards (NGO / Authority View)

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
In the initial version, all verified contributions were treated equally, regardless of the contributor’s history or reliability.
While simple, this approach risks lowering overall data quality as the system scales.

### Improvement (Round 2)
- Now , we will introduce a user credibility score based on :-
  - Past verification success rate
  - Performance in knowledge-based challenges
  - Consistency and time duration of participation
Data contributions will be weighted using this score, rather than being treated uniformly.

### Value
Credibility-weighted data improves reliability without excluding new users. It also discourages low-effort submissions and enables more responsible users to access higher-impact tasks.

## 4. Advanced Aggregation & Hotspot Analytics

### Current (Round 1)
- Basic aggregation (counts, leaderboards)

### Improvement (Round 2)
Integrating deeper analytical capabilities,including :
- Time-series analysis of actions and reports
- Automatic detection of:
  - Persistent problem areas
  - High-impact intervention zones
- Visual hotspot on maps.

### Value
These changes shift EcoQuest from a descriptive system to an analytical one, allowing institutions to act proactively rather than reactively.


## 5. Expansion of Public Reporting System

### Current (Round 1)
Public reporting in Round 1 focused on basic submission and status visibility, primarily to demonstrate feasibility.

### Improvement (Round 2)
Now , the reporting system will be expanded to include :
- Category-specific routing to relevant authorities
- SLA-based status tracking (resolution-timelines).
-Feedback mechanisms that help reporters improve submission quality

### Value
These additions improve accountability and make public reports operationally meaningful rather than purely informational.


## 6. Civic Feedback & Sentiment Dashboards

### Current (Round 1)
Public opinion and sentiment analysis were scoped conceptually but not implemented in the initial prototype.

### Improvement (Round 2)
Introduction of :
- AI-based sentiment aggregation.
- Issue-based public priority scoring.
- Location-based sentiment aligned with action data.

### Value
Combining qualitative sentiment with quantitative action data provides a more complete picture of environmental issues and public perception.

## 7. Why These Improvements Matter

All Round 2 improvements:
- Build directly on the Round 1 architecture
- Do not require redesigning the core data flow
- Focus on trust, analytical depth, and institutional usability
  
Making existing functionality reliable enough for real-world adoption.
Our central goal is still the same:
 **Transform citizen participation into reliable, scalable environmental intelligence.**


