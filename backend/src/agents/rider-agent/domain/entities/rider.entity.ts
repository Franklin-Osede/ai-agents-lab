export class Rider {
  id: string;
  tenant_id: string; // SaaS multi-tenancy support
  name: string;
  status: 'idle' | 'delivering' | 'offline';
  phone_number?: string;
  current_location?: {
    lat: number;
    lng: number;
  };
  last_active: Date;

  constructor(
    id: string,
    tenant_id: string,
    name: string,
    status: 'idle' | 'delivering' | 'offline' = 'idle',
  ) {
    this.id = id;
    this.tenant_id = tenant_id;
    this.name = name;
    this.status = status;
    this.last_active = new Date();
  }
}
