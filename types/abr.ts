// Types for ABR SearchByABNv202001 responses (WSDL-derived)
// Keep most fields optional — ABR responses vary and many fields may be suppressed.

export interface AbrSearchResponse {
  /** Metadata about request/response — usage statement, timestamps etc. */
  Request?: unknown;
  Response: AbrResponseBody;
}

export interface AbrResponseBody {
  /** Statement of ABR usage / licensing note */
  UsageStatement?: string;
  /** Date when ABR register was last updated (for this ABN) */
  DateRegisterLastUpdated?: string; // ISO 8601 date
  /** DateTime when response was retrieved */
  DateTimeRetrieved?: string; // ISO 8601 datetime
  /** The business entity details */
  ResponseBody?: AbrBusinessEntity | null;
}

export interface AbrBusinessEntity {
  // Identifier
  ABN: string; // 11-digit ABN
  ABNStatus: string; // e.g. "Active", "Cancelled"
  ABNStatusFrom?: string; // date when status effective, if provided
  PreviousAbn?: string[]; // historic ABNs (if includeHistoricalDetails = "Y")
  DateRegistered?: string; // original registration date
  DateCancelled?: string; // cancellation date (if applicable)

  // Entity identity
  EntityType?: string; // code representing entity type
  EntityName?: string; // legal / entity name
  MainBusinessAddress?: {
    State?: string; // state code (e.g. "VIC", "NSW")
    Postcode?: string;
  };
  IsCurrent?: string; // "Y"/"N" — flagged if entity is current

  // GST status
  Gst?: {
    GstFlag?: string; // "Y"/"N"
    GstEffectiveFrom?: string; // date when GST registration effective
  };

  // ASIC/ACN details (if entity is ASIC-registered)
  Acn?: string;
  Arbn?: string;

  // Registered business names (could be multiple)
  BusinessName?: (string | null)[];

  // Historical business names / trading names — may be present if includeHistoricalDetails = "Y"
  OtherTradingName?: (string | null)[];

  // Charity / Deductible Gift Recipient / Tax Concession / Super Fund flags, where relevant
  CharityIndicator?: string; // "Y"/"N"
  ConcessionType?: string; // code (if applicable)

  // Additional public fields may exist per ABR schema version; treat as optional
  [key: string]: unknown;
}

export default AbrSearchResponse;
