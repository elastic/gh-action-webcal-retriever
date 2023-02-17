'use strict'

const core = require('@actions/core')
const ical = require('node-ical');

const main = async () => {
  const url = core.getInput('webcal_url').replace('webcal', 'https');
  const webEvents = await ical.async.fromURL(url);
  const person_id = Object.entries(webEvents)
    .map(([key, event]) => event)
    .find((event) => {
      const startDate = Date.parse(event.start);
      const endDate = Date.parse(event.end);
      const now = Date.now();
      return startDate <= now && now <= endDate;
    })?.attendee;
  if (!person_id) {
    throw Error('Could not find attendee for today!');
  }

  core.setOutput('person_id', person_id);
}

main().catch(err => core.setFailed(err.message))