import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Customer } from '../../../assets/types';

export const customerFactory = Factory.define<Partial<Customer>>(() => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    taxId: faker.helpers.replaceSymbols('########?').toUpperCase(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    billingAddress: faker.location.streetAddress()
}));
