# Week 7 — Day 2: Payment Details Collection

## Context

Yesterday we polished the verification workflow. When all documents are approved, the application auto-transitions to `payment_details_pending`. Now the driver needs to submit their payment/bank details — different per city.

**Previous day**: Verification workflow — checklists, split view, batch review, auto-transition.

**What we're building today**: Dynamic payment details form driven by the city's `paymentFieldsSchema`. The driver fills in their bank details, and the application moves forward.

## Today's Focus

1. Dynamic form rendering from JSON schema
2. Payment details submission API
3. Driver payment details page
4. Admin payment verification view

## Detailed Changes

### Backend

#### 1. Payment details submission service

`apps/backend/src/modules/payments/payment.service.js`:

```javascript
export async function submitPaymentDetails(applicationId, email, details, prisma) {
  // 1. Load application — must be in payment_details_pending stage
  // 2. Load city via job → get paymentFieldsSchema
  // 3. Validate details against schema (all required fields present, types correct)
  // 4. Create/update PaymentDetailSubmission record
  // 5. Transition application to onboarding_call via stage engine
  // 6. Return success
}

export async function getPaymentDetails(applicationId, prisma) {
  // Return existing payment details (for edit/view)
  // Redact sensitive fields for driver view (show last 4 digits of account number, etc.)
}

export async function getPaymentSchema(applicationId, prisma) {
  // Load the city's paymentFieldsSchema for this application
  // Return the schema so the frontend can render the form
}

export async function verifyPaymentDetails(applicationId, adminEmail, prisma) {
  // Admin marks payment details as verified
  // Optional — could be auto-verified on submission
}
```

#### 2. Dynamic validation

The `paymentFieldsSchema` stored in the City model defines fields like:
```json
{
  "fields": [
    { "key": "bank_name", "label": "Bank Name", "type": "text", "required": true },
    { "key": "account_holder", "label": "Account Holder Name", "type": "text", "required": true },
    { "key": "account_number", "label": "Account Number", "type": "text", "required": true, "pattern": "^[0-9]{8}$", "patternMessage": "Must be 8 digits" },
    { "key": "sort_code", "label": "Sort Code", "type": "text", "required": true, "pattern": "^[0-9]{6}$", "patternMessage": "Must be 6 digits" }
  ]
}
```

Validation function:
```javascript
export function validatePaymentDetails(details, schema) {
  const errors = {};
  for (const field of schema.fields) {
    const value = details[field.key];
    if (field.required && (!value || !value.trim())) {
      errors[field.key] = `${field.label} is required`;
    }
    if (value && field.pattern && !new RegExp(field.pattern).test(value)) {
      errors[field.key] = field.patternMessage || `Invalid format for ${field.label}`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
```

#### 3. Routes

Driver:
```
GET  /api/driver/payment/schema   — get payment fields schema for their city
GET  /api/driver/payment          — get existing payment details (redacted)
POST /api/driver/payment          — submit payment details
```

Admin:
```
GET  /api/applications/:id/payment — view payment details (full, for admin)
POST /api/applications/:id/payment/verify — mark as verified
```

### Frontend (Driver Web)

#### 1. New route: `/payment`

```jsx
<Route path="/payment" element={<ProtectedRoute><PaymentGuard><PaymentDetails /></PaymentGuard></ProtectedRoute>} />
```

#### 2. `PaymentGuard.jsx`

Checks application is in `payment_details_pending` — redirects to dashboard if not.

#### 3. `apps/driver-web/src/pages/PaymentDetails.jsx`

**Dynamic form rendering:**

```jsx
function PaymentDetails() {
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load schema from API
    // Load existing details if any (for edit)
  }, []);

  return (
    <PageLayout title="Payment Details">
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
          <CardDescription>
            Please provide your payment details. These will be used to pay you for completed shifts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schema?.fields.map(field => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={values[field.key]}
              error={errors[field.key]}
              onChange={(v) => setValues(prev => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit}>Submit Payment Details</Button>
        </CardFooter>
      </Card>
    </PageLayout>
  );
}
```

#### 4. `apps/driver-web/src/components/DynamicFormField.jsx`

Renders a form field based on the schema definition:

```jsx
function DynamicFormField({ field, value, error, onChange }) {
  switch (field.type) {
    case 'text':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input value={value} onChange={e => onChange(e.target.value)} />
          {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
    case 'select':
      return (
        <div>
          <Label>{field.label}</Label>
          <Select value={value} onValueChange={onChange}>
            {field.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </Select>
        </div>
      );
    // Add more field types as needed
  }
}
```

#### 5. Success state

After submission:
- Redirect to dashboard
- Toast: "Payment details submitted successfully!"
- Dashboard shows: "Payment details received. Your onboarding call will be scheduled."

### Frontend (Admin Web)

#### 1. Payment details in ApplicationDetailPanel

Add a "Payment" section in the detail panel:
- Show all submitted fields (NOT redacted for admin)
- "Verified" badge if admin has verified
- "Verify" button (optional step — marks as reviewed)
- Submission date

## Acceptance Criteria

- [ ] Payment schema loaded from city configuration
- [ ] Dynamic form renders all field types
- [ ] Client-side validation matches schema rules
- [ ] Server-side validation enforces all constraints
- [ ] Payment details stored securely
- [ ] Submission transitions to `onboarding_call`
- [ ] Existing details pre-filled for edit
- [ ] Admin can view full payment details
- [ ] Admin can verify payment details
- [ ] Redacted view for driver (post-submission)

## What's Next (Day 3)

Tomorrow we build the **onboarding call tracking** system — scheduling, completion tracking, and call notes.
