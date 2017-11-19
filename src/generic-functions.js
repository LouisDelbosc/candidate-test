import moment from 'moment';

export const cloneDate = (momentDate) => {
  return moment(momentDate.toDate());  // To make a complete new momentdate
};


export const rangeDate = (start, end, step=30, unit='minutes') => {
  if(start > end) {
    return [];
  }
  let slots = [];
  let date_iterator = start.clone();
  while (date_iterator < end) {
    slots = [...slots, cloneDate(date_iterator)];
    date_iterator.add(step, unit);
  }
  return slots;
};

export const groupby = (list, func) => {
  return list.reduce((acc, value) => {
    const key = func(value);
    const oldValue = acc[key] || [];
    return Object.assign(acc, {[key]: [ ...oldValue, value]});
  }, {});
};

export const factory = {
  opening: (args = {}) => {
    return Object.assign({
      kind: 'opening',
      starts_at: new Date('2014-08-04 09:30'),
      ends_at: new Date('2014-08-04 12:30'),
      weekly_recurring: true
    }, args);
  },

  appointment: (args = {}) => {
    return Object.assign({
      kind: 'appointment',
      starts_at: new Date('2014-08-10 09:30'),
      ends_at: new Date('2014-08-10 12:30')
    }, args);
  },

  date: (date) => {
    return moment(new Date(date));
  },
}
