# EcoQuest Data Flow

## Step 0: User Task Submission (Client Side)

User submits evidence for an environmental task:
- **Task selection** (from available eco tasks)
- **Evidence** (image upload)
- **User description** (what they claim to have done)

Example:
- Task: "Clean up a public park"
- User description: "This photo shows me cleaning the park"
- Evidence: Image upload

The client packages this into a POST request to `/api/submissions`.

---

## Step 1: API Layer – Request Intake

The API layer (`/api/submissions` route) performs:
1. **Authentication** via JWT token
2. **Rate limiting** 
3. **Schema validation**

Validation checks:
- User is authenticated
- Task exists and is active
- Evidence image exists and is valid format
- User description is provided

If validation fails → request is rejected immediately with 400/401/403.

---

## Step 2: Initial Processing & Status

The system creates a `Submission` record with:
- `taskId`, `userId`, `evidence.imageUrls`, `evidence.description`
- Initial status: `pending_verification`
- Timestamp: `submittedAt`

This ensures audit trail from the moment of submission.

---

## Step 3: Dual AI Analysis Pipeline

The system runs **two separate AI analyses** in sequence:

### 3.1 Semantic Verification
- **Purpose**: Verify if image matches the **task description**
- **Input**: Image + Task title/description
- **AI Model**: Gemini 2.5 Flash
- **Output**: `semantic_score` (0-1) + explanation

```javascript
const semantic = await semanticVerification(imagePath, taskClaim);
// Returns: { semantic_score: 0.85, explanation: "..." }
```

### 3.2 Fraud Detection  
- **Purpose**: Detect manipulation, staging, or deception
- **Input**: Image + **User description**
- **AI Model**: Gemini 2.5 Flash  
- **Output**: `fraud_score` (0-1) + explanation

```javascript
const fraud = await fraudDetection(imagePath, userDescription);
// Returns: { fraud_score: 0.15, explanation: "..." }
```

Both analyses run independently with separate prompts and error handling.

---

## Step 4: Verification Decision Engine

The `decideVerification()` function combines both scores:

```javascript
function decideVerification({ aiConfidence, fraudScore, minConfidence }) {
  const confidenceThreshold = minConfidence || 0.75;
  
  if (aiConfidence >= 0.85 && fraudScore <= 0.3) return "approved";
  if (aiConfidence >= confidenceThreshold) return "manual_review";
  return "rejected";
}
```

**Decision Logic:**
- **High confidence + Low fraud** → Auto-approved
- **Medium confidence** → Manual review
- **Low confidence** → Rejected

---

## Step 5: Result Storage & Status Update

The system stores results in multiple places:

### VerificationResult Document
- `submissionId`: Reference to submission
- `aiConfidence`: Semantic score
- `fraudScore`: Fraud score  
- `reason`: Human-readable decision reason
- `explanation`: Combined AI explanations
- `flags`: Processing flags (e.g., "semantic_verification", "fraud_detection")
- `finalStatus`: "approved"/"manual_review"/"rejected"

### Submission Document Update
- `status`: Updated to "verified"/"rejected"/"manual_review"
- `verification`: Embedded verification object with all scores and metadata

---

## Step 6: Response to Client

The API returns the submission status with verification details:

```json
{
  "submission": {
    "id": "...",
    "status": "verified",
    "verification": {
      "aiConfidence": 0.85,
      "fraudScore": 0.15,
      "reason": "Verified by AI",
      "explanation": "...",
      "finalDecision": "approved"
    }
  }
}
```

---

## Step 7: Asynchronous Processing (Non-blocking)

Some operations happen in parallel without blocking the user response:
- **User score updates** (if approved)
- **Leaderboard recalculation** 
- **Notification systems**
- **Analytics tracking**

---

## Error Handling & Fallbacks

### AI Service Unavailable
- If `GEMINI_API_KEY` missing → flags as "gemini_key_missing"
- Falls back to "manual_review" status
- Reason: "AI verification not configured"

### AI API Errors
- Network timeouts, rate limits → flags as "semantic_verification_error"
- Falls back to "manual_review" 
- Detailed error logged for debugging

### Invalid AI Responses
- Malformed JSON or missing scores → flags as "semantic_verification_invalid"
- Falls back to "manual_review"
- Preserves user submission for admin review

---

## Why This Flow Is Robust

- **Dual AI analysis**: Semantic verification + fraud detection provide complementary insights
- **Separate prompts**: Each AI call has focused, optimized prompts
- **Graceful degradation**: System continues working even if AI fails
- **Full audit trail**: Every decision, score, and flag is stored
- **Human oversight**: Edge cases automatically route to manual review
- **Transparent explanations**: Users and admins get detailed AI reasoning

---

## Summary Flow

Task Submission  
→ Validate & Create Record  
→ Run Semantic Verification (image vs task)  
→ Run Fraud Detection (image vs user description)  
→ Combine Scores → Make Decision  
→ Store Results & Update Status  
→ Return Response to User
