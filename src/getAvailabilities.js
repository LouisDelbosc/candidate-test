import moment from 'moment'
import knex from 'knexClient'

// export async function getAvailabilities(date) {
//   // Implement your algorithm here
//   const open = await getOpenings(date)
//   return open
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

export const getOpenings = async (date) => {
  const date_with_7_days = moment(date).add(7, 'days');
  const reccuring_opening = await knex('events')
        .select('starts_at', 'ends_at')
        .where({kind: 'opening', weekly_recurring: true})
        .andWhere('starts_at', '<=', date_with_7_days.valueOf());
  const weekly_opening = await knex('events')
        .select('starts_at', 'ends_at')
        .where({kind: 'opening', weekly_recurring: false})
        .andWhere('starts_at', '>=', date.getTime())
        .andWhere('ends_at', '<=', date_with_7_days.valueOf());

  return [...reccuring_opening, ...weekly_opening]
    .map(opening => toOpening(moment(opening.starts_at), moment(opening.ends_at)));
};

export const intoCurrentWeek = (day, reccuring_opening) => {
  const { starts_at, ends_at } = reccuring_opening;
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
