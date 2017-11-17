import moment from 'moment'
import knex from 'knexClient'

// export async function getAvailabilities(date) {
//   // Implement your algorithm here
//   const open = await getOpenings(date)
//   return open
// }

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

  return [...reccuring_opening, ...weekly_opening].map(opening => {
    return {
      starts_at: moment(opening.starts_at),
      ends_at: moment(opening.ends_at)
    };
  });
};

export const rangeDate = (start, end, step=30, unit='minutes') => {
  if(start > end) {
    return [];
  }
  let slots = [];
  let date_iterator = start.clone();
  while (date_iterator < end) {
    slots = [...slots, moment(date_iterator.toDate())];
    date_iterator.add(step, unit);
  }
  return slots;
}

export const generateSlots = (opening) => {
  // let slots = [];
  // for(let date_iter = moment(starts_at); date_iter.isBefore(ends_at); date_iter.add(30, 'mins')) {
  //   slots.push(date_iter);
  // }
}


export const generate_slots = (opening_event) => {
  return
}
