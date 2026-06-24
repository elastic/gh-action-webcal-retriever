import * as core from '@actions/core'
import ical from 'node-ical'
import * as dateFormat from 'date-and-time'

/**
 * Fetches calendar data with retry logic and exponential backoff
 * @param {string} url - The URL to fetch
 * @param {number} maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @returns {Promise<object>} Calendar events
 */
const fetchCalendarWithRetry = async (url, maxAttempts = 3, initialDelay = 1000, backoffMultiplier = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      core.info(`Fetching calendar from ${url} (attempt ${attempt}/${maxAttempts})`);
      return await ical.async.fromURL(url);
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || String(error);
      core.warning(`Attempt ${attempt} failed: ${errorMessage}`);
      
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
        core.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed, throw the last error
  throw new Error(`Failed to fetch calendar after ${maxAttempts} attempts: ${lastError.message || String(lastError)}`);
};

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
    webEvents = await fetchCalendarWithRetry(url);
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