import Routing from '../../../routing/init';
import { Appointment, DashboardStats, HealthCheck, Patient } from '../../../types';
import { apiClient } from '../httpClient';
import { extractCollection } from '../utils/collectionUtils';

export interface DashboardSummary {
  stats: DashboardStats;
  health: HealthCheck;
  appointments: Appointment[];
  recentPatients: Patient[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date();
  const startStr = `${today.toISOString().split('T')[0]}T00:00:00`;
  const endStr = `${today.toISOString().split('T')[0]}T23:59:59`;

  const [statsResponse, healthResponse, appointmentsResponse, patientsResponse] = await Promise.all([
    apiClient.get<DashboardStats>(Routing.generate('api_dashboard_stats')),
    apiClient.get<HealthCheck>(Routing.generate('api_health')),
    apiClient.get(Routing.generate('api_appointments_collection'), {
      params: { start: startStr, end: endStr },
    }),
    apiClient.get(Routing.generate('api_patients_collection'), {
      params: { itemsPerPage: 5, 'order[id]': 'desc' },
    }),
  ]);

  const appointments = extractCollection<Appointment>(appointmentsResponse.data).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return {
    stats: statsResponse.data,
    health: healthResponse.data,
    appointments,
    recentPatients: extractCollection<Patient>(patientsResponse.data),
  };
}
