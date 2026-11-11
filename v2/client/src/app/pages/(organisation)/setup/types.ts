export interface LocationInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export interface LocationSuggestion {
  name: string;
  detail: string;
  full: string;
}

export interface PhotonFeature {
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}
