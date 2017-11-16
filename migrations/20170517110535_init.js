export const up = knex =>
  knex.schema.createTable('events', table => {
    table.increments()
    table.dateTime('starts_at').notNullable()
    table.dateTime('ends_at').notNullable()
    table.enum('kind', ['appointment', 'opening']).notNullable()
    table.boolean('weekly_recurring')
  })

export const down = knex => knex.schema.dropTable('events')
