import moment from 'moment'
import knex from 'knexClient'

// export async function getAvailabilities(date) {
//   // Implement your algorithm here
//   const open = await getOpenings(date)
//   return open
// }

export const getOpenings = (date) => {
  const date_with_7_days = moment(date).add(7, 'days')
  return knex('events')
        .select('*')
        .where({kind: 'opening', weekly_recurring: true})
        .orWhereRaw(`kind = 'opening' and
                     starts_at >= ${date.getTime()} and
                     ends_at <= ${date_with_7_days.valueOf()}`);
}

export const generate_slots = (opening_event) => {
  return
}
