import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Patient } from '../../../assets/types';

export const patientFactory = Factory.define<Partial<Patient>>(() => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    taxId: faker.helpers.replaceSymbols('########?').toUpperCase(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
    phone: faker.phone.number(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    profession: faker.person.jobTitle(),
    sportsActivity: faker.helpers.arrayElement(['Football', 'Tennis', 'Swimming', 'None']),
    rate: faker.helpers.arrayElement(['50€', '60€', 'Student']),
    allergies: faker.helpers.arrayElement(['None', 'Latex', 'Pollen']),
    medication: 'None',
    systemicDiseases: 'None',
    surgeries: 'None',
    accidents: 'None',
    injuries: 'None',
    bruxism: faker.helpers.arrayElement(['No', 'Yes, nocturnal']),
    insoles: 'No',
    others: '',
    notes: faker.lorem.sentence(),
    status: 'active' as const,
    createdAt: new Date().toISOString()
}));
