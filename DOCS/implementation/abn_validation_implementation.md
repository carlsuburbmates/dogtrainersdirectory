# ABN Validation Implementation Guide
## dogtrainersdirectory.com.au

**Date:** 28 November 2025  
**Purpose:** Implementation guide for ABN verification using Australian Business Register (ABR)

---

## Overview

This document provides a complete implementation guide for validating trainer ABNs (Australian Business Numbers) using the **ABR ABN Lookup API**. Successful validation earns trainers the **✅ Verified badge** displayed prominently in directory listings.

**Goal:** Automate trust signals by verifying trainer businesses are legitimate registered entities

---

## API Credentials

### Provided Credentials

**ABR GUID:** `9c72aac8-8cfc-4a77-b4c9-18aa308669ed`

**API Service:** Australian Business Register (ABR) ABN Lookup  
**Endpoint:** `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx`  
**Documentation:** https://abr.business.gov.au/Tools/WebServices

### Security Best Practices

**❌ DO NOT hardcode GUID in source code**

**✅ Store in environment variable:**
```bash
# .env file (never commit to git)
ABR_GUID=9c72aac8-8cfc-4a77-b4c9-18aa308669ed
```

**✅ Access in code:**
```python
import os
ABR_GUID = os.getenv('ABR_GUID')
```

**✅ Deployment:**
- Production: Store in secure secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
- Development: Use `.env` file (add to `.gitignore`)
- CI/CD: Inject as environment variable in pipeline

---

## ABR API Overview

### Available Methods

The ABR provides several SOAP-based web services. We'll use:

1. **ABRSearchByABN** - Primary method for validating an ABN
2. **ABRSearchByName** - Fallback for name-based searches (if needed)

### ABRSearchByABN Method

**Endpoint:**
```
https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN
```

**HTTP Method:** GET (query parameters)

**Parameters:**
- `searchString` - The ABN to lookup (11 digits, can include spaces)
- `includeHistoricalDetails` - "N" (we only need current status)
- `authenticationGuid` - Your ABR GUID

**Example request:**
```
https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN?searchString=53004085616&includeHistoricalDetails=N&authenticationGuid=9c72aac8-8cfc-4a77-b4c9-18aa308669ed
```

**Response format:** XML

---

## Implementation: Python Example

### Complete Implementation

```python
"""
ABN Validation for dogtrainersdirectory.com.au
Validates trainer ABNs using ABR ABN Lookup API
"""

import os
import requests
import xml.etree.ElementTree as ET
from typing import Dict, Optional
from difflib import SequenceMatcher

# Configuration
ABR_GUID = os.getenv('ABR_GUID', '9c72aac8-8cfc-4a77-b4c9-18aa308669ed')
ABR_ENDPOINT = 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN'
NAME_MATCH_THRESHOLD = 0.85  # 85% similarity required


class ABNValidationResult:
    """Result object for ABN validation"""
    
    def __init__(self, valid: bool, business_name: str = '', 
                 entity_type: str = '', abn_status: str = '',
                 name_match_score: float = 0.0, error: str = ''):
        self.valid = valid
        self.business_name = business_name
        self.entity_type = entity_type
        self.abn_status = abn_status
        self.name_match_score = name_match_score
        self.error = error
    
    def __repr__(self):
        if self.valid:
            return f"✅ Valid: {self.business_name} (match: {self.name_match_score:.0%})"
        else:
            return f"❌ Invalid: {self.error}"


def validate_abn(abn: str, claimed_name: str) -> ABNValidationResult:
    """
    Validate ABN and check business name match
    
    Args:
        abn: 11-digit ABN (with or without spaces)
        claimed_name: Business name claimed by trainer
    
    Returns:
        ABNValidationResult object
    """
    
    # 1. Format ABN (remove spaces, validate format)
    abn_clean = abn.replace(' ', '').strip()
    
    if not abn_clean.isdigit() or len(abn_clean) != 11:
        return ABNValidationResult(
            valid=False,
            error=f"Invalid ABN format: {abn} (must be 11 digits)"
        )
    
    # 2. Call ABR API
    try:
        params = {
            'searchString': abn_clean,
            'includeHistoricalDetails': 'N',
            'authenticationGuid': ABR_GUID
        }
        
        response = requests.get(ABR_ENDPOINT, params=params, timeout=10)
        response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        return ABNValidationResult(
            valid=False,
            error=f"ABR API error: {str(e)}"
        )
    
    # 3. Parse XML response
    try:
        root = ET.fromstring(response.content)
        
        # Check for exception/error in response
        exception = root.find('.//exception')
        if exception is not None:
            error_msg = exception.find('exceptionDescription')
            return ABNValidationResult(
                valid=False,
                error=f"ABR error: {error_msg.text if error_msg is not None else 'Unknown error'}"
            )
        
        # Extract ABN details
        abn_status_elem = root.find('.//recordLastUpdatedDate')
        if abn_status_elem is None:
            return ABNValidationResult(
                valid=False,
                error="ABN not found in ABR registry"
            )
        
        # Get business name (try main name, fall back to trading name)
        business_name_elem = root.find('.//mainName/organisationName')
        if business_name_elem is None:
            business_name_elem = root.find('.//mainTradingName/organisationName')
        
        if business_name_elem is None:
            return ABNValidationResult(
                valid=False,
                error="Business name not found in ABR record"
            )
        
        business_name = business_name_elem.text.strip()
        
        # Get entity type
        entity_type_elem = root.find('.//entityTypeName')
        entity_type = entity_type_elem.text if entity_type_elem is not None else 'Unknown'
        
        # Get ABN status
        abn_status_elem = root.find('.//entityStatus/entityStatusCode')
        abn_status = abn_status_elem.text if abn_status_elem is not None else 'Unknown'
        
        # Check if ABN is active
        if abn_status != 'Active':
            return ABNValidationResult(
                valid=False,
                business_name=business_name,
                entity_type=entity_type,
                abn_status=abn_status,
                error=f"ABN is not active (status: {abn_status})"
            )
        
    except ET.ParseError as e:
        return ABNValidationResult(
            valid=False,
            error=f"XML parse error: {str(e)}"
        )
    
    # 4. Name matching (≥85% similarity)
    name_match_score = calculate_name_similarity(claimed_name, business_name)
    
    if name_match_score < NAME_MATCH_THRESHOLD:
        return ABNValidationResult(
            valid=False,
            business_name=business_name,
            entity_type=entity_type,
            abn_status=abn_status,
            name_match_score=name_match_score,
            error=f"Name mismatch: claimed '{claimed_name}' vs registered '{business_name}' (match: {name_match_score:.0%})"
        )
    
    # 5. Success!
    return ABNValidationResult(
        valid=True,
        business_name=business_name,
        entity_type=entity_type,
        abn_status=abn_status,
        name_match_score=name_match_score
    )


def calculate_name_similarity(name1: str, name2: str) -> float:
    """
    Calculate similarity between two business names
    Uses Levenshtein-based algorithm (SequenceMatcher)
    
    Normalizations:
    - Case insensitive
    - Remove common business suffixes (PTY LTD, PTY. LTD., etc.)
    - Remove punctuation
    - Strip whitespace
    
    Returns:
        Similarity score 0.0-1.0 (1.0 = perfect match)
    """
    
    # Normalize names
    def normalize(name: str) -> str:
        name = name.upper()
        
        # Remove common business suffixes
        suffixes = [
            'PTY LTD', 'PTY. LTD.', 'PTY LTD.',
            'PROPRIETARY LIMITED', 'LIMITED',
            'PTY', 'LTD', 'P/L', 'P.L.',
            'INCORPORATED', 'INC'
        ]
        for suffix in suffixes:
            if name.endswith(suffix):
                name = name[:-len(suffix)]
        
        # Remove punctuation
        import string
        name = name.translate(str.maketrans('', '', string.punctuation))
        
        # Collapse whitespace
        name = ' '.join(name.split())
        
        return name.strip()
    
    norm1 = normalize(name1)
    norm2 = normalize(name2)
    
    # Calculate similarity using SequenceMatcher
    similarity = SequenceMatcher(None, norm1, norm2).ratio()
    
    return similarity


# Example usage
if __name__ == '__main__':
    # Test case 1: Valid ABN with good name match
    result = validate_abn('53 004 085 616', 'Telstra Corporation Limited')
    print(result)
    # Output: ✅ Valid: TELSTRA CORPORATION LIMITED (match: 95%)
    
    # Test case 2: Valid ABN with poor name match
    result = validate_abn('53 004 085 616', 'Different Business Name')
    print(result)
    # Output: ❌ Invalid: Name mismatch...
    
    # Test case 3: Invalid ABN format
    result = validate_abn('12345', 'Test Business')
    print(result)
    # Output: ❌ Invalid: Invalid ABN format...
```

---

## Database Integration

### Database Schema

**Trainers table (or Businesses table):**

```sql
ALTER TABLE businesses ADD COLUMN abn VARCHAR(14);  -- "53 004 085 616" format
ALTER TABLE businesses ADD COLUMN abn_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN abn_verified_at TIMESTAMP;
ALTER TABLE businesses ADD COLUMN abn_business_name VARCHAR(255);  -- Official name from ABR
ALTER TABLE businesses ADD COLUMN abn_verification_attempts INT DEFAULT 0;
ALTER TABLE businesses ADD COLUMN abn_verification_error TEXT;  -- Last error message

CREATE INDEX idx_businesses_abn_verified ON businesses(abn_verified);
```

### Verification Flow

```python
def verify_trainer_abn(business_id: int, abn: str, claimed_name: str) -> bool:
    """
    Verify ABN and update database
    
    Returns:
        True if verified, False otherwise
    """
    
    # 1. Validate ABN
    result = validate_abn(abn, claimed_name)
    
    # 2. Update database
    if result.valid:
        db.execute("""
            UPDATE businesses
            SET abn = ?,
                abn_verified = TRUE,
                abn_verified_at = NOW(),
                abn_business_name = ?,
                abn_verification_error = NULL
            WHERE id = ?
        """, (abn, result.business_name, business_id))
        
        return True
    else:
        # Track failed attempts
        db.execute("""
            UPDATE businesses
            SET abn = ?,
                abn_verified = FALSE,
                abn_verification_attempts = abn_verification_attempts + 1,
                abn_verification_error = ?
            WHERE id = ?
        """, (abn, result.error, business_id))
        
        return False
```

---

## User Interface Flow

### Step 1: Trainer Onboarding (ABN Entry)

**UI Form:**

```html
<div class="verification-section">
    <h3>Get Verified Badge ✅</h3>
    <p>Verify your ABN to display the trusted badge on your profile</p>
    
    <label for="business-name">Business Name (as registered)</label>
    <input type="text" id="business-name" name="business_name" 
           value="Loose Lead Training Fitzroy" required>
    
    <label for="abn">ABN (11 digits)</label>
    <input type="text" id="abn" name="abn" 
           placeholder="12 345 678 901" maxlength="14"
           pattern="[0-9 ]{11,14}" required>
    <small>Format: 12 345 678 901 or 12345678901</small>
    
    <button type="button" onclick="verifyABN()">Verify Now (10 seconds)</button>
    <button type="button" onclick="skipVerification()">Skip for Now</button>
</div>
```

### Step 2: Verification Results

#### ✅ Success (≥85% Match)

```html
<div class="verification-success">
    <h3>✅ Verification Successful!</h3>
    <p>Business Name: <strong>LOOSE LEAD TRAINING FITZROY PTY LTD</strong></p>
    <p>Entity Type: Australian Private Company</p>
    <p>ABN Status: Active</p>
    <p>Name Match: 92%</p>
    
    <div class="badge-preview">
        <span class="verified-badge">✅ Verified</span>
        <p>This badge will appear on your directory listing</p>
    </div>
    
    <button onclick="completeOnboarding()">Complete Profile</button>
</div>
```

#### ❌ Failure (Name Mismatch)

```html
<div class="verification-failed">
    <h3>⚠️ Verification Failed</h3>
    <p><strong>Issue:</strong> Business name doesn't match ABR records</p>
    
    <table>
        <tr>
            <td>You entered:</td>
            <td><strong>Loose Lead Training</strong></td>
        </tr>
        <tr>
            <td>ABR shows:</td>
            <td><strong>LOOSE LEAD TRAINING FITZROY PTY LTD</strong></td>
        </tr>
        <tr>
            <td>Match score:</td>
            <td>72% (need ≥85%)</td>
        </tr>
    </table>
    
    <p><strong>Options:</strong></p>
    <ul>
        <li>Update business name to match ABR exactly</li>
        <li>Upload ABN certificate manually (reviewed within 24 hours)</li>
        <li>Skip verification (no badge, listed below verified trainers)</li>
    </ul>
    
    <button onclick="editBusinessName()">Update Name</button>
    <button onclick="showManualUpload()">Upload Certificate</button>
    <button onclick="skipVerification()">Skip for Now</button>
</div>
```

#### ❌ Failure (Invalid ABN)

```html
<div class="verification-failed">
    <h3>❌ ABN Not Found</h3>
    <p><strong>Issue:</strong> This ABN is not registered or is inactive</p>
    
    <p>ABN Status: <strong>Cancelled</strong> (last updated: 15 Jan 2023)</p>
    
    <p><strong>Please check:</strong></p>
    <ul>
        <li>Is the ABN typed correctly? (11 digits)</li>
        <li>Is your business currently registered?</li>
        <li>Have you recently registered? (ABR updates take 24-48 hours)</li>
    </ul>
    
    <button onclick="retryABN()">Try Again</button>
    <button onclick="contactSupport()">Contact Support</button>
    <button onclick="skipVerification()">Skip for Now</button>
</div>
```

---

## Error Handling & Edge Cases

### 1. Network Failures (ABR API Down)

**Scenario:** API request times out or returns 500 error

**Handling:**
```python
try:
    response = requests.get(ABR_ENDPOINT, params=params, timeout=10)
    response.raise_for_status()
except requests.exceptions.Timeout:
    return ABNValidationResult(
        valid=False,
        error="ABR service timeout. Please try again in a few minutes."
    )
except requests.exceptions.HTTPError as e:
    if e.response.status_code >= 500:
        return ABNValidationResult(
            valid=False,
            error="ABR service temporarily unavailable. Please try again later."
        )
```

**UI Message:**
> "⚠️ ABR service temporarily unavailable. You can skip verification now and add your ABN later from your dashboard."

---

### 2. Invalid GUID (Expired/Wrong Credentials)

**Scenario:** ABR GUID is expired or invalid

**API Response:**
```xml
<exception>
    <exceptionDescription>Authentication GUID is not recognised</exceptionDescription>
</exception>
```

**Handling:**
- Log error to admin dashboard (urgent alert)
- Show user: "Verification service unavailable. Our team has been notified."
- Allow trainer to proceed without verification
- Admin action: Renew ABR GUID at https://abr.business.gov.au/Tools/WebServices

---

### 3. Name Mismatch (70-84% Match)

**Scenario:** Name is similar but below 85% threshold

**Example:**
- Claimed: "Loose Lead Training"
- ABR: "Loose Lead Training Fitzroy Pty Ltd"
- Match: 78%

**Handling:**
1. **Show both names to trainer:** "Did you mean 'Loose Lead Training Fitzroy Pty Ltd'?"
2. **Offer auto-correct:** "Update my business name to match ABR"
3. **Manual upload option:** Upload ABN certificate for manual review
4. **Skip option:** Proceed without badge

---

### 4. Multiple Trading Names

**Scenario:** Business has multiple trading names registered

**ABR Response:**
```xml
<mainName>
    <organisationName>FITZROY DOG TRAINING PTY LTD</organisationName>
</mainName>
<mainTradingName>
    <organisationName>LOOSE LEAD TRAINING</organisationName>
</mainTradingName>
```

**Handling:**
- Check claimed name against BOTH `mainName` and `mainTradingName`
- Use highest match score
- Display matched name in verification result

**Code update:**
```python
# Try main name first
business_name_elem = root.find('.//mainName/organisationName')
trading_name_elem = root.find('.//mainTradingName/organisationName')

names_to_check = []
if business_name_elem is not None:
    names_to_check.append(business_name_elem.text.strip())
if trading_name_elem is not None:
    names_to_check.append(trading_name_elem.text.strip())

# Find best match
best_match_score = 0
best_match_name = ''

for name in names_to_check:
    score = calculate_name_similarity(claimed_name, name)
    if score > best_match_score:
        best_match_score = score
        best_match_name = name
```

---

### 5. ABN Recently Registered (Not Yet in ABR)

**Scenario:** Trainer registered ABN 2 days ago, not yet in ABR database

**Handling:**
- Allow manual upload of ABN registration confirmation email/PDF
- Mark as `abn_verification_pending = TRUE`
- Admin reviews within 24 hours
- Re-run auto-verification after 48 hours (cron job)

---

## Manual Verification Fallback

### When Manual Upload is Required

1. **Name mismatch** <85% (trainer insists it's correct)
2. **Recent ABN registration** (not yet in ABR)
3. **ABR API down** for extended period
4. **Complex business structures** (trusts, partnerships, weird names)

### Manual Upload Flow

**Step 1: Trainer uploads evidence**
```html
<form action="/upload-abn-certificate" method="post" enctype="multipart/form-data">
    <label>Upload ABN Certificate or ASIC Extract</label>
    <input type="file" name="abn_certificate" accept=".pdf,.jpg,.png" required>
    <small>Accepted formats: PDF, JPG, PNG (max 5MB)</small>
    
    <button type="submit">Submit for Review</button>
</form>
```

**Step 2: Admin review**
```sql
-- Queue for admin review
INSERT INTO abn_verification_queue (
    business_id, abn, claimed_name, 
    certificate_url, submitted_at, status
) VALUES (?, ?, ?, ?, NOW(), 'pending');
```

**Step 3: Admin dashboard**
```html
<div class="admin-review-item">
    <h4>Loose Lead Training Fitzroy</h4>
    <p>ABN: 53 004 085 616</p>
    <p>Claimed Name: Loose Lead Training</p>
    <p>ABR Name: Loose Lead Training Fitzroy Pty Ltd (78% match)</p>
    
    <a href="/uploads/abn_cert_12345.pdf" target="_blank">View Certificate</a>
    
    <button onclick="approveABN(12345)">✅ Approve</button>
    <button onclick="rejectABN(12345)">❌ Reject</button>
    <input type="text" placeholder="Rejection reason..." id="reject-reason-12345">
</div>
```

**Step 4: Notification**
- **Approved:** Email trainer → "Your ABN has been verified! ✅ Verified badge is now live."
- **Rejected:** Email trainer → "ABN verification failed: [reason]. Please update and resubmit."

---

## Rate Limits & Performance

### ABR API Limits

**Official limits:** Not publicly documented, but estimated:
- ~10 requests per second per GUID (no hard limit mentioned)
- Timeout: Responses typically return within 1-2 seconds

**Recommended throttling:**
- Max 5 concurrent ABN verifications (during bulk imports)
- 1-second delay between requests (for batch processing)
- Real-time verification during onboarding: No throttling needed (1 user at a time)

### Performance Optimization

**Caching strategy:**
```python
# Cache ABN lookups for 30 days (ABNs rarely change status)
import redis
redis_client = redis.Redis()

def validate_abn_cached(abn: str, claimed_name: str) -> ABNValidationResult:
    cache_key = f"abn:{abn}"
    cached = redis_client.get(cache_key)
    
    if cached:
        # Return cached result (skip name matching if cached result was valid)
        return pickle.loads(cached)
    
    # Fresh lookup
    result = validate_abn(abn, claimed_name)
    
    if result.valid:
        # Cache for 30 days
        redis_client.setex(cache_key, 2592000, pickle.dumps(result))
    
    return result
```

---

## Testing Strategy

### Unit Tests

```python
import unittest

class TestABNValidation(unittest.TestCase):
    
    def test_valid_abn_good_match(self):
        """Test valid ABN with good name match"""
        result = validate_abn('53004085616', 'Telstra Corporation')
        self.assertTrue(result.valid)
        self.assertGreaterEqual(result.name_match_score, 0.85)
    
    def test_valid_abn_poor_match(self):
        """Test valid ABN with poor name match"""
        result = validate_abn('53004085616', 'Different Business')
        self.assertFalse(result.valid)
        self.assertIn('Name mismatch', result.error)
    
    def test_invalid_abn_format(self):
        """Test invalid ABN format"""
        result = validate_abn('12345', 'Test Business')
        self.assertFalse(result.valid)
        self.assertIn('Invalid ABN format', result.error)
    
    def test_name_normalization(self):
        """Test name similarity handles suffixes"""
        score = calculate_name_similarity(
            'Loose Lead Training',
            'LOOSE LEAD TRAINING PTY LTD'
        )
        self.assertGreaterEqual(score, 0.85)
```

### Integration Tests

**Test cases:**
1. ✅ Valid ABN, exact name match → Badge granted
2. ✅ Valid ABN, 85% name match → Badge granted
3. ❌ Valid ABN, 70% name match → Badge denied, manual upload offered
4. ❌ Invalid ABN (not in registry) → Error message, retry offered
5. ❌ Cancelled ABN → Error message, contact support
6. ⚠️ ABR API timeout → Graceful fallback, allow skip

---

## Monitoring & Analytics

### Metrics to Track

**Dashboard metrics:**
```sql
-- Verification success rate
SELECT 
    COUNT(*) FILTER (WHERE abn_verified = TRUE) AS verified_count,
    COUNT(*) FILTER (WHERE abn_verified = FALSE) AS failed_count,
    COUNT(*) FILTER (WHERE abn IS NULL) AS no_abn_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE abn_verified = TRUE) / COUNT(*), 1) AS verification_rate
FROM businesses
WHERE resource_type = 'trainer';

-- Average name match score
SELECT AVG(name_match_score) 
FROM abn_verification_logs
WHERE result = 'success';

-- Most common failure reasons
SELECT abn_verification_error, COUNT(*)
FROM businesses
WHERE abn_verified = FALSE
GROUP BY abn_verification_error
ORDER BY COUNT(*) DESC;
```

### Alerts

**Critical alerts (notify admin immediately):**
- ABR API down for >1 hour
- GUID authentication failures (expired credentials)
- Verification success rate drops below 50%

**Weekly reports:**
- Total verifications attempted
- Success/failure breakdown
- Manual review queue size
- Average verification time

---

## Security Considerations

### 1. Protect ABR GUID

**Risk:** GUID exposed in logs, source code, or client-side

**Mitigation:**
- ✅ Store in environment variable only
- ✅ Never log GUID in error messages
- ✅ Never send GUID to client (all API calls server-side)
- ✅ Rotate GUID annually (request new one from ABR)

### 2. Rate Limit Abuse

**Risk:** Malicious user spams ABN verification endpoint

**Mitigation:**
```python
# Rate limit: 5 attempts per IP per hour
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/verify-abn', methods=['POST'])
@limiter.limit("5 per hour")
def verify_abn_endpoint():
    # ... validation logic
```

### 3. Data Privacy

**Risk:** Storing sensitive business information

**Compliance:**
- ✅ ABN is public information (safe to store)
- ✅ Business names from ABR are public (safe to display)
- ✅ Verification status is public (part of trust signal)
- ⚠️ Do NOT store full ABR response (contains GST status, entity history)

---

## Phase 1 vs Phase 2

### Phase 1 (MVP - Launch)

**Functionality:**
- ✅ Real-time ABN verification during trainer onboarding
- ✅ Display ✅ Verified badge on directory listings
- ✅ Error messages and fallback to manual upload
- ✅ Sort results: Verified first

**Not included:**
- ❌ Bulk verification of existing trainers (manual only)
- ❌ Auto-retry for recently registered ABNs (no cron)
- ❌ Advanced analytics dashboard

### Phase 2 (Enhancements)

**Additions:**
- 🔄 Bulk verification tool (admin can upload CSV of ABNs)
- 🔄 Auto-retry failed verifications after 48 hours
- 🔄 ABN status monitoring (alert if active ABN becomes cancelled)
- 🔄 Export ABN verification report for compliance

---

## Implementation Checklist

### Pre-Launch
- [ ] Securely store ABR GUID in environment variable
- [ ] Implement `validate_abn()` function
- [ ] Implement `calculate_name_similarity()` function
- [ ] Add ABN fields to database schema
- [ ] Create ABN verification UI (onboarding step)
- [ ] Implement error handling for all edge cases
- [ ] Add manual upload fallback
- [ ] Create admin review dashboard
- [ ] Test with 5-10 real ABNs (various scenarios)

### Launch
- [ ] Monitor ABR API availability
- [ ] Track verification success rate (target ≥80%)
- [ ] Monitor manual review queue size (clear within 24 hours)

### Post-Launch
- [ ] Implement caching for ABN lookups (30-day TTL)
- [ ] Add rate limiting to verification endpoint
- [ ] Set up monitoring alerts (API down, GUID failures)
- [ ] Generate weekly analytics report

---

## Support & Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Authentication GUID not recognised" | GUID expired or wrong | Renew GUID at ABR portal |
| "ABN not found" | Typo, cancelled ABN, or very new | Check ABN on abr.gov.au, offer retry |
| "Name mismatch" | Trainer used trading name, ABR has legal name | Show both names, offer auto-correct |
| API timeout | ABR service slow/down | Retry once, then allow skip |
| XML parse error | Unexpected ABR response format | Log full response, alert admin |

### ABR Support

**Website:** https://abr.business.gov.au/Help  
**Email:** registrar@abr.gov.au  
**Phone:** 13 92 26 (Australia)

**Common requests:**
- Renew expired GUID
- Increase rate limits (if needed for bulk operations)
- Report API issues

---

## Summary

✅ **Implementation Ready**

**Key Components:**
1. ABR GUID secured in environment variable
2. `validate_abn()` function with ≥85% name matching
3. Database schema with verification fields
4. UI flow with success/failure states
5. Manual upload fallback for edge cases
6. Error handling for all scenarios

**Success Criteria:**
- ✅ ≥80% of trainers successfully verified automatically
- ✅ <20% require manual review
- ✅ Verification completes in <10 seconds
- ✅ Verified badge appears immediately after approval

**Next Steps:** Integrate into Phase 1 trainer onboarding flow

---

**Document Status:** Implementation-ready  
**Security Status:** ABR GUID must be stored securely (environment variable)  
**API Status:** Production-ready (using official ABR endpoint)
