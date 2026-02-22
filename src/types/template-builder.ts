export interface BuilderElement {
  id: string;
  label: string;
  type: 'text' | 'chart' | 'field';
}

export interface BuilderVariable {
  id: string;
  token: string;
  description: string;
}
