import knex from 'knexClient';
import moment from 'moment'
import { getAvailabilities, getOpenings, rangeDate, intoCurrentWeek } from './getAvailabilities';

const openingFactory = (args = {}) => {
  return Object.assign({
    kind: 'opening',
    starts_at: new Date('2014-08-04 09:30'),
    ends_at: new Date('2014-08-04 12:30'),
    weekly_recurring: true
  }, args);
};

const dateFactory = (date) => {
  return moment(new Date(date));
};

describe('getAvailabilities', () => {
  beforeEach(() => knex('events').truncate());

  describe('intoCurrentWeek()', () => {
    it('should not modify an opening if it is on the same week', () => {
      const day = dateFactory('2014-08-11');
      const reccuring_opening = {
        starts_at: dateFactory('2014-08-12 09:30'),
        ends_at: dateFactory('2014-08-12 12:30')
      };
      expect(intoCurrentWeek(day, reccuring_opening)).toEqual(reccuring_opening);
    });

    it('should update a past opening to the week of the day', () => {
      const day = dateFactory('2014-08-11');
      const reccuring_opening = {
        starts_at: dateFactory('2014-08-04 09:30'),
        ends_at: dateFactory('2014-08-04 12:30')
      };
      expect(intoCurrentWeek(day, reccuring_opening)).toEqual({
        starts_at: dateFactory('2014-08-11 09:30'),
        ends_at: dateFactory('2014-08-11 12:30')
      });
    });
  });

  describe('getOpenings', async () => {
    it('should get recurring opening where starts_date < arg_date', async () => {
      const opening = openingFactory({ weekly_recurring: true });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(new Date('2014-08-10'));
      expect(openingDates.length).toBe(1);
    });

    it('should not get recurring opening where starts_date > arg_date', async () => {
      const opening = openingFactory({
        starts_at: new Date('2014-08-20 09:30'),
        ends_at: new Date('2014-08-20 12:30'),
        weekly_recurring: true
      });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(new Date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });

    it('should not get opening where the date is already passed', async () => {
      const opening = openingFactory({ weekly_recurring: false });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(new Date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });

    it('should get opening where the date is the week', async () => {
      const opening = openingFactory({
        starts_at: new Date('2014-08-11 09:30'),
        ends_at: new Date('2014-08-11 12:30'),
        weekly_recurring: false
      });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(new Date('2014-08-10'));
      expect(openingDates.length).toBe(1);
    });

    it('should not get appointment', async () => {
      const opening = openingFactory({ kind: 'appointment' });
      await knex('events').insert(opening);
      const openingDates = await getOpenings(new Date('2014-08-10'));
      expect(openingDates.length).toBe(0);
    });
  });

  describe('generateSlots', () => {
    it('should generate all the date between two date with 30min interval', () => {
      const start = dateFactory('2014-08-10 12:30');
      const end = dateFactory('2014-08-10 09:30');
      expect(rangeDate(start, end)).toEqual([]);
    });

    it('should generate all the date between two date with 30min interval', () => {
      const start = dateFactory('2014-08-10 09:30');
      const end = dateFactory('2014-08-10 12:30');
      expect(rangeDate(start, end)).toEqual([
        dateFactory('2014-08-10 09:30'),
        dateFactory('2014-08-10 10:00'),
        dateFactory('2014-08-10 10:30'),
        dateFactory('2014-08-10 11:00'),
        dateFactory('2014-08-10 11:30'),
        dateFactory('2014-08-10 12:00'),
      ]);
    });
  });

  // describe('simple case', () => {
  //   beforeEach(async () => {
  //     await knex('events').insert([
  //       {
  //         kind: 'opening',
  //         starts_at: new Date('2014-08-04 09:30'),
  //         ends_at: new Date('2014-08-04 12:30'),
  //         weekly_recurring: true,
  //       },
  //       {
  //         kind: 'appointment',
  //         starts_at: new Date('2014-08-11 10:30'),
  //         ends_at: new Date('2014-08-11 11:30'),
  //       },
  //     ])
  //   })

  //   it('should fetch availabilities correctly', async () => {
  //     const availabilities = await getAvailabilities(new Date('2014-08-10'))
  //     expect(availabilities.length).toBe(7)

  //     expect(String(availabilities[0].date)).toBe(
  //       String(new Date('2014-08-10')),
  //     )
  //     expect(availabilities[0].slots).toEqual([])

  //     expect(String(availabilities[1].date)).toBe(
  //       String(new Date('2014-08-11')),
  //     )
  //     expect(availabilities[1].slots).toEqual([
  //       '9:30',
  //       '10:00',
  //       '11:30',
  //       '12:00',
  //     ])

  //     expect(String(availabilities[6].date)).toBe(
  //       String(new Date('2014-08-16')),
  //     )
  //   })
  // })
})
