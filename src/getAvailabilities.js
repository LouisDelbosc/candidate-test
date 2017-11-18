import moment from 'moment'
import knex from 'knexClient'

// export async function getAvailabilities(date) {
//   // Implement your algorithm here
//   const opens = await getOpenings(date)
//   const slots = generateSlot(opens)
//   groupby(slot, day)
//   formatAvailabilities(day, groupbied)
// }

const cloneDate = (momentDate) => {
  return moment(momentDate.toDate());
};

const toOpening = (start, end) => {
  return {
    starts_at: start,
    ends_at: end
  };
};

export const groupby = (list, func) => {
  return list.reduce((acc, value) => {
    const key = func(value);
    const oldValue = acc[key] || [];
    return Object.assign(acc, {[key]: [ ...oldValue, value]});
  }, {});
};

export const getOpenings = async (date) => {
  const date_with_7_days = cloneDate(date).add(7, 'days');
  const reccuring_opening = await knex('events')
        .select('starts_at', 'ends_at')
        .where({kind: 'opening', weekly_recurring: true})
        .andWhere('starts_at', '<=', date_with_7_days.valueOf());
  const weekly_opening = await knex('events')
        .select('starts_at', 'ends_at')
        .where({kind: 'opening', weekly_recurring: false})
        .andWhere('starts_at', '>=', date.valueOf())
        .andWhere('ends_at', '<=', date_with_7_days.valueOf());

  return [...reccuring_opening, ...weekly_opening]
    .map(opening => toOpening(moment(opening.starts_at), moment(opening.ends_at)))
    .map(opening => intoCurrentWeek(date, opening));
};

export const intoCurrentWeek = (day, opening) => {
  const { starts_at, ends_at } = opening;
  while (starts_at < day) {
    starts_at.add(7, 'days');
    ends_at.add(7, 'days');
  }
  return toOpening(cloneDate(starts_at), cloneDate(ends_at));
};

export const rangeDate = (start, end, step=30, unit='minutes') => {
  if(start > end) {
    return [];
  }
  let slots = [];
  let date_iterator = start.clone();
  while (date_iterator < end) {
    slots = [...slots, cloneDate(date_iterator)]; // To make a complete new momentdate
    date_iterator.add(step, unit);
  }
  return slots;
};
