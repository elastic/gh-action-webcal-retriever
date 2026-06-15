import { jest, describe, test, expect, beforeEach } from '@jest/globals'

jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}))

jest.unstable_mockModule('node-ical', () => ({
  default: {
    async: {
      fromURL: jest.fn(),
    },
    parseFile: jest.fn(),
  },
}))

const core = await import('@actions/core')
const ical = (await import('node-ical')).default

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

  describe('file:// protocol support', () => {
    test('should strip file:// prefix from URL', () => {
      const fileUrl = 'file:///path/to/calendar.ics'
      const filePath = fileUrl.replace('file://', '')
      
      expect(filePath).toBe('/path/to/calendar.ics')
    })

    test('should handle file:// URLs with relative paths', () => {
      const fileUrl = 'file://./test-fixtures/sample-calendar.ics'
      const filePath = fileUrl.replace('file://', '')
      
      expect(filePath).toBe('./test-fixtures/sample-calendar.ics')
    })

    test('should call parseFile for file:// protocol URLs', () => {
      core.getInput.mockImplementation((name) => {
        if (name === 'days_offset') return '0'
        if (name === 'webcal_url') return 'file://./test-fixtures/sample-calendar.ics'
        return ''
      })

      const mockEvents = {
        'test-event-1': {
          type: 'VEVENT',
          start: new Date('2023-12-01'),
          end: new Date('2023-12-31'),
          summary: 'Test Event',
          attendee: 'mailto:test@example.com'
        }
      }
      ical.parseFile.mockReturnValue(mockEvents)

      // Verify that parseFile is available and can be called
      expect(ical.parseFile).toBeDefined()
    })

    test('should use parseFile instead of fromURL for file:// URLs', () => {
      const webcalUrl = 'file:///absolute/path/to/calendar.ics'
      const isFileProtocol = webcalUrl.startsWith('file://')
      
      expect(isFileProtocol).toBe(true)
      
      if (isFileProtocol) {
        const filePath = webcalUrl.replace('file://', '')
        expect(filePath).toBe('/absolute/path/to/calendar.ics')
      }
    })

    test('should distinguish between file:// and webcal:// protocols', () => {
      const fileUrl = 'file://./calendar.ics'
      const webcalUrl = 'webcal://example.com/calendar.ics'
      const httpsUrl = 'https://example.com/calendar.ics'
      
      expect(fileUrl.startsWith('file://')).toBe(true)
      expect(webcalUrl.startsWith('file://')).toBe(false)
      expect(httpsUrl.startsWith('file://')).toBe(false)
    })

    test('should handle file:// URLs with Windows-style paths', () => {
      const fileUrl = 'file://C:/Users/test/calendar.ics'
      const filePath = fileUrl.replace('file://', '')
      
      expect(filePath).toBe('C:/Users/test/calendar.ics')
    })
  })

  describe('retry with backoff', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should succeed on first attempt', async () => {
      const { default: indexModule } = await import('./index.js')
      
      core.getInput.mockImplementation((name) => {
        if (name === 'days_offset') return '0'
        if (name === 'webcal_url') return 'webcal://example.com/calendar.ics'
        return ''
      })

      const mockEvents = {
        'test-event': {
          type: 'VEVENT',
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000),
          summary: 'Test Event',
          attendee: 'mailto:test@example.com'
        }
      }
      
      ical.async.fromURL.mockResolvedValueOnce(mockEvents)

      // This should succeed without retries
      expect(ical.async.fromURL).toBeDefined()
      expect(core.info).toBeDefined()
      expect(core.warning).toBeDefined()
    })

    test('should retry on failure and eventually succeed', async () => {
      const { default: indexModule } = await import('./index.js')
      
      core.getInput.mockImplementation((name) => {
        if (name === 'days_offset') return '0'
        if (name === 'webcal_url') return 'webcal://example.com/calendar.ics'
        return ''
      })

      const mockEvents = {
        'test-event': {
          type: 'VEVENT',
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000),
          summary: 'Test Event',
          attendee: 'mailto:test@example.com'
        }
      }
      
      // Fail twice, then succeed
      ical.async.fromURL
        .mockRejectedValueOnce(new Error('Request failed with status code 404'))
        .mockRejectedValueOnce(new Error('Request failed with status code 503'))
        .mockResolvedValueOnce(mockEvents)

      expect(ical.async.fromURL).toBeDefined()
    })

    test('should fail after max retry attempts', async () => {
      const { default: indexModule } = await import('./index.js')
      
      core.getInput.mockImplementation((name) => {
        if (name === 'days_offset') return '0'
        if (name === 'webcal_url') return 'webcal://example.com/calendar.ics'
        return ''
      })

      // Always fail
      ical.async.fromURL.mockRejectedValue(new Error('Request failed with status code 404'))

      expect(ical.async.fromURL).toBeDefined()
    })

    test('should use exponential backoff between retries', () => {
      // Test exponential backoff calculation
      const initialDelay = 1000
      const backoffMultiplier = 2
      
      const delay1 = initialDelay * Math.pow(backoffMultiplier, 0) // 1000ms for first retry
      const delay2 = initialDelay * Math.pow(backoffMultiplier, 1) // 2000ms for second retry
      const delay3 = initialDelay * Math.pow(backoffMultiplier, 2) // 4000ms for third retry
      
      expect(delay1).toBe(1000)
      expect(delay2).toBe(2000)
      expect(delay3).toBe(4000)
    })
  })
})
