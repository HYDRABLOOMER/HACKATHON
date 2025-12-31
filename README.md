# EcoQuest  
**A Civic Data Platform for Verified Environmental Action**

EcoQuest is a web-based platform that converts citizen environmental actions into verified, geo-tagged environmental data. It addresses the gap between grassroots participation and institutional visibility by treating citizen action as a structured data-generation process rather than a one-time engagement activity.

This repository contains a working prototype and supporting documentation demonstrating one complete system loop: task execution → verification → aggregation → feedback.

Documentation Index

The documentaion for markdown files:

 1- Project Overview  
**[OVERVIEW.md](./OVERVIEW.md)**  
Explains the problem being addressed, the core insight behind EcoQuest, and the overall system purpose.

2- Feature Breakdown  
**[FEATURES.md](./FEATURES.md)**  
Detailed explanation of each system module, including task execution, verification, and aggregation.

3- Data Flow & System Design  
**[DATA_FLOW.md](./DATA_FLOW.md)**  
Textual Data Flow Diagrams (DFD) and technical flows showing how data moves through the system.

4- Round 2 Improvements   
**[ROUND2_IMPROVEMENTS.md](./ROUND2_IMPROVEMENTS.md)**  
Planned technical and system-level enhancements for the next round.


 Prototype Scope (Round 1)

The current prototype demonstrates:
- Task selection and submission
- Simulated verification workflow
- Persistent storage of verified actions
- Aggregated feedback via points and statistics

AI verification, moderation, and external integrations are simulated to prioritize clarity of system flow.

 Tech Stack

- Frontend: React.js  
- Backend: Node.js (Express) / Python (Flask)  
- Database: MongoDB (Atlas Free Tier) / In-memory storage  
- Hosting: Free-tier cloud services  


 Notes for Reviewers

- The focus of this submission is **system coherence**, not feature completeness.
- All simulated components are explicitly documented.
- The architecture is designed to be extended in Round 2.

