export interface ValidationError {
  message: string;
  nodeId?: string;
  edgeId?: string;
  type?: 'error' | 'warning';
}

export interface ValidationState {
  errors: ValidationError[];
  isValid: boolean;
} 