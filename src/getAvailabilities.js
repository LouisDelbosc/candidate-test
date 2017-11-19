import moment from 'moment'
import knex from 'knexClient'

export async function getAvailabilities(date) {
  // Implement your algorithm here
  const momentDate = moment(date);
  const openings = await getOpenings(momentDate);
  const appointments = await getAppointment(momentDate);
  const openingSlots = openings
        .reduce((acc, {starts_at, ends_at}) => [...acc, ...rangeDate(starts_at, ends_at)], []);
  const availableSlots = appointments
        .reduce((acc, appointment) => filterAppointment(appointment, acc), openingSlots);
  const groupbyDate = groupby(availableSlots, (date) => date.clone().startOf('days'));
  return formatAvailabilities(momentDate, groupbyDate);
}

const cloneDate = (momentDate) => {
  return moment(momentDate.toDate());
};

const toAppointment = (...args) => toOpening(...args);

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

export const formatAvailabilities = (date, slotsByDay) => {
  const week_days = rangeDate(date, date.clone().add(7, 'days'), 1, 'days');
  return week_days.map(datetime => {
    const day = datetime.startOf('days');
    const slotsDay = slotsByDay[String(day)] || [];
    return {
      date: day,
      slots: slotsDay.map(date => date.format('HH:mm'))
    };
  });
}

export const filterAppointment = (appointment, slots) => {
  const appointmentRange = rangeDate(appointment.starts_at, appointment.ends_at);
  return slots.filter(slot => !(appointmentRange).find(x => slot.isSame(x)));
};

export const getAppointment = async (date) => {
  const date_with_7_days = cloneDate(date).add(7, 'days');
  return knex('events')
    .select('starts_at', 'ends_at')
    .where({kind: 'appointment'})
    .andWhere('starts_at', '>=', date.valueOf())
    .andWhere('ends_at', '<=', date_with_7_days.valueOf())
    .then(
      appointments => appointments
        .map(({starts_at, ends_at}) => toAppointment(moment(starts_at), moment(ends_at))));
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
    .map(({starts_at, ends_at}) => toOpening(moment(starts_at), moment(ends_at)))
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
