'use strict'

const core = require('@actions/core')
const ical = require('node-ical');

const main = async () => {
  const days_offset_str = core.getInput('days_offset') ?? 0;
  const days_offset = days_offset_str ? parseInt(days_offset_str) : 0;
  const url = core.getInput('webcal_url').replace('webcal', 'https');
  const webEvents = await ical.async.fromURL(url);
  const person_id = Object.entries(webEvents)
    .map(([key, event]) => event)
    .find((event) => {
      const startDate = Date.parse(event.start);
      const endDate = Date.parse(event.end);
      
      const targetDate = Date.now();
      targetDate.setDate(targetDate.getDate() + days_offset);
      return startDate <= targetDate && targetDate <= endDate;
    })?.attendee;
  if (!person_id) {
    throw Error('Could not find attendee for today!');
  }

  core.setOutput('person_id', person_id);
}

main().catch(err => core.setFailed(err.message))