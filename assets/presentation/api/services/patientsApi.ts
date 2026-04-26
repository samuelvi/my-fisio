import Routing from '../../../routing/init';
import { Patient } from '../../../types';
import { apiClient } from '../httpClient';
import { extractCollection } from '../utils/collectionUtils';

export interface FetchPatientsParams {
  status: string;
  order: string;
  page: number;
  itemsPerPage: number;
  search: string;
  fuzzy: boolean;
}

export async function fetchPatientsCollection(params: FetchPatientsParams): Promise<Patient[]> {
  const response = await apiClient.get(Routing.generate('api_patients_collection'), {
    params,
  });

  return extractCollection<Patient>(response.data);
}
