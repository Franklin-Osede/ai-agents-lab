export class Rider {
  id: string;
  tenant_id: string; // SaaS multi-tenancy support
  name: string;
  status: 'idle' | 'delivering' | 'offline';
  profile_image_url?: string;
  vehicle_desc?: string;
  current_location?: { lat: number; lng: number };
  last_active: Date;

  constructor(
    id: string,
    tenant_id: string,
    name: string,
    status: 'idle' | 'delivering' | 'offline' = 'idle',
    profile_image_url?: string,
    vehicle_desc?: string,
  ) {
    this.id = id;
    this.tenant_id = tenant_id;
    this.name = name;
    this.status = status;
    this.profile_image_url = profile_image_url;
    this.vehicle_desc = vehicle_desc;
    this.last_active = new Date();
  }
}
