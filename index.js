import * as core from '@actions/core'
import ical from 'node-ical';
import * as dateFormat from 'date-and-time'

const main = async () => {
  const days_offset_str = core.getInput('days_offset') ?? 0;
  const days_offset = days_offset_str ? parseInt(days_offset_str) : 0;
  const webcal_url = core.getInput('webcal_url');
  
  let webEvents;
  if (webcal_url.startsWith('file://')) {
    const filePath = webcal_url.replace('file://', '');
    webEvents = ical.parseFile(filePath);
  } else {
    const url = webcal_url.startsWith('webcal://')
      ? webcal_url.replace('webcal://', 'https://')
      : webcal_url;
    webEvents = await ical.async.fromURL(url);
  }
  const targetEvent = Object.entries(webEvents)
    .map(([key, event]) => event)
    .find((event) => {
      const startDate = Date.parse(event.start);
      const endDate = Date.parse(event.end);
      
      const targetDate = Date.now() + (days_offset * 24 * 60 * 60 * 1000);
      return startDate <= targetDate && targetDate <= endDate;
    });

  const person_id = targetEvent?.attendee;
  const start = new Date(targetEvent?.start);
  const end = new Date(targetEvent?.end);
  
  if (!person_id || !start || !end) {
    core.setOutput('success', false);
  } else {
    core.setOutput('success', true);
    core.setOutput('person_id', person_id);
    core.setOutput('start_date', dateFormat.format(start, 'MMM, DD'))
    core.setOutput('end_date', dateFormat.format(end, 'MMM, DD'))
  }
}

main().catch(err => core.setFailed(err.message))