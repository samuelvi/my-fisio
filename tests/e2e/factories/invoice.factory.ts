import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Invoice } from '../../../assets/types';

export const invoiceFactory = Factory.define<Partial<Invoice>>(() => ({
    number: `F${new Date().getFullYear()}${faker.string.numeric(6)}`,
    date: new Date().toISOString().split('T')[0],
    fullName: faker.person.fullName(),
    taxId: faker.helpers.replaceSymbols('########?').toUpperCase(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    amount: 60,
    currency: 'EUR',
    lines: [
        {
            concept: 'Physiotherapy Session',
            description: '45 min treatment',
            quantity: 1,
            price: 60,
            amount: 60
        }
    ]
}));
