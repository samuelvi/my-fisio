import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { RecordEntry } from '../../../assets/types';

export const recordFactory = Factory.define<Partial<RecordEntry>>(() => ({
    physiotherapyTreatment: faker.lorem.paragraph(),
    consultationReason: faker.lorem.sentence(),
    onset: 'Gradual',
    currentSituation: faker.lorem.sentence(),
    evolution: 'Stable',
    radiologyTests: 'None',
    medicalTreatment: 'None',
    homeTreatment: 'Stretching',
    notes: faker.lorem.sentence(),
    sickLeave: false,
    createdAt: new Date().toISOString()
}));
