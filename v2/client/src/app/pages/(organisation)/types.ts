export type OrganisationSummary = {
  id: string;
  name: string;
  slug: string;
};

export type OrganisationContextValue = {
  organisation: OrganisationSummary;
  /** Better Auth role string for the current member, e.g. "engineer". UI hints only. */
  role: string;
  /** Re-reads the member's role, e.g. after a role change or when the tab regains focus. */
  refreshRole: () => Promise<void>;
  leaveOrganisation: () => Promise<void>;
};
