import knex from 'knexClient';
import moment from 'moment';
import {
  getAvailabilities,
  getOpenings,
  getAppointment,
  formatAvailabilities,
} from './getAvailabilities';
import { factory } from './generic-functions.js';

describe('integration test (using db)', () => {
  beforeEach(() => knex('events').truncate());

  describe('formatAvailabilities()', () => {
    const slotByDay = {
      [factory.date('2014-08-10').startOf('days')]: [
        factory.date('2014-08-10 09:30'),
        factory.date('2014-08-10 10:00'),
        factory.date('2014-08-10 10:30'),
      ],
      [factory.date('2014-08-11').startOf('days')]: [
        factory.date('2014-08-11 11:00'),
      ],
      [factory.date('2014-08-12').startOf('days')]: [
        factory.date('2014-08-12 11:30'),
        factory.date('2014-08-12 12:00'),
      ]
    };
    expect(formatAvailabilities(factory.date('2014-08-10'), slotByDay)).toEqual([
      {
        date: factory.date('2014-08-10').startOf('days'),
        slots: ['09:30', '10:00', '10:30']
      }, {
        date: factory.date('2014-08-11').startOf('days'),
        slots: ['11:00']
      }, {
        date: factory.date('2014-08-12').startOf('days'),
        slots: ['11:30', '12:00']
      }, {
        date: factory.date('2014-08-13').startOf('days'),
        slots: []
      }, {
        date: factory.date('2014-08-14').startOf('days'),
        slots: []
      }, {
        date: factory.date('2014-08-15').startOf('days'),
        slots: []
      }, {
        date: factory.date('2014-08-16').startOf('days'),
        slots: []
      }
    ]);
  });

  describe('getAppointment()', async () => {
    it('should not get openings', async () => {
      const opening = factory.opening();
      await knex('events').insert(opening);
      const appointment = await getAppointment(factory.date('2014-08-10'));
      expect(appointment.length).toBe(0)
    });

    it('should not get past or futur appointment', async () => {
      const pastAppointment = factory.appointment({
        starts_at: new Date('2014-08-04 09:30'),
        ends_at: new Date('2014-08-04 10:00'),
      });
      const futurAppointment = factory.appointment({
        starts_at: new Date('2014-08-20 09:30'),
        ends_at: new Date('2014-08-20 10:00'),
      });
      await knex('events').insert([pastAppointment, futurAppointment]);
      const appointment = await getAppointment(factory.date('2014-08-10'));
      expect(appointment.length).toBe(0)
    });

    it('should get week appointment', async () => {
      const weekAppointment = factory.appointment({
        starts_at: new Date('2014-08-12 09:30'),
        ends_at: new Date('2014-08-12 10:00'),
      });
      await knex('events').insert(weekAppointment);
      const appointment = await getAppointment(factory.date('2014-08-10'));
      expect(appointment.length).toBe(1)
    });
  });

  describe('getOpenings', async () => {
    it('should get recurring opening where starts_date < arg_date', async () => {
      const opening = factory.opening({ weekly_recurring: true });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(1);
    });

    it('should not get recurring opening where starts_date > arg_date', async () => {
      const opening = factory.opening({
        starts_at: new Date('2014-08-20 09:30'),
        ends_at: new Date('2014-08-20 12:30'),
        weekly_recurring: true
      });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });

    it('should get recurring opening in the past in the right week', async () => {
      const opening = factory.opening({
        starts_at: new Date('2014-08-04 09:30'),
        ends_at: new Date('2014-08-04 12:30'),
        weekly_recurring: true
      });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(1);
      expect(openingDates[0]).toEqual({
        starts_at: factory.date('2014-08-11 09:30'),
        ends_at: factory.date('2014-08-11 12:30')
      });
    });

    it('should not get opening where the date is already passed', async () => {
      const opening = factory.opening({ weekly_recurring: false });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });

    it('should get opening where the date is the week', async () => {
      const opening = factory.opening({
        starts_at: new Date('2014-08-11 09:30'),
        ends_at: new Date('2014-08-11 12:30'),
        weekly_recurring: false
      });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(1);
    });

    it('should not get appointment', async () => {
      const opening = factory.opening({ kind: 'appointment' });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(factory.date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });
  });

  describe('getAvailabilities()', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2014-08-04 09:30'),
          ends_at: new Date('2014-08-04 12:30'),
          weekly_recurring: true,
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30'),
        },
      ]);
    });

    it('should fetch availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-10'));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(factory.date('2014-08-10').startOf('days')),
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[1].date)).toBe(
        String(factory.date('2014-08-11').startOf('days')),
      );
      expect(availabilities[1].slots).toEqual([
        '09:30',
        '10:00',
        '11:30',
        '12:00',
      ]);

      expect(String(availabilities[6].date)).toBe(
        String(factory.date('2014-08-16').startOf('days')),
      );
    });
  });
});
