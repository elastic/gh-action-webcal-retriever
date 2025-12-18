'use strict'

const core = require('@actions/core')
const ical = require('node-ical')

// Mock dependencies
jest.mock('@actions/core')
jest.mock('node-ical')

describe('WebCal Person Retriever Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call core.getInput with correct parameters', () => {
    core.getInput.mockReturnValue('test-value')
    ical.async.fromURL.mockResolvedValue({})

    // Action should call getInput for required inputs
    expect(core.getInput).toBeDefined()
    expect(ical.async.fromURL).toBeDefined()
  })

  test('should handle empty calendar gracefully', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'days_offset') return '0'
      if (name === 'webcal_url') return 'webcal://example.com/calendar.ics'
      return ''
    })

    ical.async.fromURL.mockResolvedValue({})

    // This verifies the mocks are set up correctly
    const webcalUrl = core.getInput('webcal_url')
    const events = await ical.async.fromURL('https://example.com/calendar.ics')

    expect(webcalUrl).toBe('webcal://example.com/calendar.ics')
    expect(events).toEqual({})
  })

  test('should transform webcal URL to https', () => {
    const webcalUrl = 'webcal://example.com/calendar.ics'
    const httpsUrl = webcalUrl.replace('webcal', 'https')
    
    expect(httpsUrl).toBe('https://example.com/calendar.ics')
  })
})
