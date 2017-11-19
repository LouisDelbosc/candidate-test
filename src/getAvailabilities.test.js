import moment from 'moment';
import {filterAppointment, intoCurrentWeek} from './getAvailabilities';
import { rangeDate, groupby, factory } from './generic-functions';

describe('generic functions', () => {
  describe('rangeDate', () => {
    it('should generate empty array if the interval is invalid', () => {
      const start = factory.date('2014-08-10 12:30');
      const end = factory.date('2014-08-10 09:30');
      expect(rangeDate(start, end)).toEqual([]);
    });

    it('should generate a range between two date with 30min interval', () => {
      const start = factory.date('2014-08-10 09:30');
      const end = factory.date('2014-08-10 12:30');
      expect(rangeDate(start, end)).toEqual([
        factory.date('2014-08-10 09:30'),
        factory.date('2014-08-10 10:00'),
        factory.date('2014-08-10 10:30'),
        factory.date('2014-08-10 11:00'),
        factory.date('2014-08-10 11:30'),
        factory.date('2014-08-10 12:00'),
      ]);
    });
  });

  describe('groupby()', () => {
    it('should group by odd or not odd', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(groupby(numbers, (n) => n % 2)).toEqual({
        0: [2, 4],
        1: [1, 3, 5]
      });
    });

    it('should group datetime by day', () => {
      const datetime_array = [
        factory.date('2014-08-10 09:30'),
        factory.date('2014-08-10 10:00'),
        factory.date('2014-08-10 10:30'),
        factory.date('2014-08-11 11:00'),
        factory.date('2014-08-12 11:30'),
        factory.date('2014-08-12 12:00'),
      ];
      const groupbyDate = groupby(datetime_array, (date) => date.clone().startOf('days'));
      expect(groupbyDate).toEqual({
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
      });
    });
  });
});

describe('business functions', () => {
  describe('filterAppointment', () => {
    const appointment = {
      starts_at: factory.date('2014-08-12 10:30'),
      ends_at: factory.date('2014-08-12 11:30'),
    };
    const slots = [
      factory.date('2014-08-12 09:30'),
      factory.date('2014-08-12 10:00'),
      factory.date('2014-08-12 10:30'),
      factory.date('2014-08-12 11:00'),
      factory.date('2014-08-12 11:30'),
      factory.date('2014-08-12 12:00'),
    ];
    expect(filterAppointment(appointment, slots)).toEqual([
      factory.date('2014-08-12 09:30'),
      factory.date('2014-08-12 10:00'),
      factory.date('2014-08-12 11:30'),
      factory.date('2014-08-12 12:00'),
    ]);
  });

  describe('intoCurrentWeek()', () => {
    it('should not modify an opening if it is on the same week', () => {
      const day = factory.date('2014-08-11');
      const reccuring_opening = {
        starts_at: factory.date('2014-08-12 09:30'),
        ends_at: factory.date('2014-08-12 12:30')
      };
      expect(intoCurrentWeek(day, reccuring_opening)).toEqual(reccuring_opening);
    });

    it('should update a past opening to the week of the day', () => {
      const day = factory.date('2014-08-11');
      const reccuring_opening = {
        starts_at: factory.date('2014-08-04 09:30'),
        ends_at: factory.date('2014-08-04 12:30')
      };
      expect(intoCurrentWeek(day, reccuring_opening)).toEqual({
        starts_at: factory.date('2014-08-11 09:30'),
        ends_at: factory.date('2014-08-11 12:30')
      });
    });
  });
});
