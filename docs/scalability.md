# Scalability

## What Needs to Scale

1. API traffic
2. AI inference
3. Storage and audits
4. Human review (optional)

Each is handled independently.

---

## 1. API Layer Scaling

### Approach
- Stateless APIs
- Horizontal scaling

### Why this works
- No session state stored in memory
- Any request can hit any instance

### Result
- Add more instances → more throughput
- Easy load balancing


## 2. Verification Orchestrator Scaling

### Key Design Choice
The orchestrator is **logic-heavy but compute-light**.

### What it does
- Routing decisions
- Pipeline selection
- Threshold checks

### Scaling Strategy
- Runs in the same stateless environment as the API
- Scales horizontally with API instances

This avoids bottlenecks before AI inference.

---

## 3. AI Inference Scaling (Main Bottleneck)

This is the expensive part.

### Problem
- Vision-language models are slow and costly
- Cannot run everything synchronously at scale

### Solution
We split verification into two modes:

#### A. Real-Time Mode
- Used for low traffic or premium requests
- Synchronous inference
- Immediate response

#### B. Async Mode
- Used at scale
- Requests queued
- Results returned later or via polling

This prevents system overload.

---

## 4. Queue-Based Processing

AI jobs are placed into a queue with:
- Priority
- Claim type
- Evidence type

Benefits:
- Smooths traffic spikes
- Prevents GPU saturation
- Allows fair scheduling

If the queue backs up:
- System degrades gracefully
- Requests are delayed, not dropped

---

## 5. Model-Level Optimization

### Strategies Used
- Model size selection based on claim complexity
- Caching repeated semantic patterns
- Batch inference where possible

Example:
Multiple claims using similar images or activities can share partial inference results.

---

## 6. Storage Scaling

### Design
- Evidence stored separately (object storage)
- Metadata and results in a database

### Why this matters
- Large files don’t slow queries
- Easy archival of old data

Audit logs are append-only, which scales well.

---

## 7. Human-in-the-Loop Scaling (Optional)

For low-confidence cases:
- System flags the request
- Human review happens asynchronously

Important:
- Human review is not in the critical path
- System still responds with provisional scores

This prevents review workload from blocking verification.

---

## 8. Failure Handling at Scale

### AI Failure
- Return “insufficient confidence”
- Log failure
- Do not guess

### System Overload
- Queue expands
- Real-time mode throttled
- Async mode prioritized

The system never silently fails.

---

## Why This Scales in Practice

- Stateless core services
- AI isolated behind queues
- Graceful degradation under load
- Costs grow linearly, not explosively

---

## Summary

- API and orchestrator scale horizontally
- AI inference is controlled and queued
- Storage is decoupled and durable
- System remains usable under load, not brittle
