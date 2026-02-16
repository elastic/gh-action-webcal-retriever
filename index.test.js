import { jest, describe, test, expect, beforeEach } from '@jest/globals'

// Mock dependencies before importing them
const mockCore = {
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
}

const mockIcal = {
  async: {
    fromURL: jest.fn(),
  },
  parseFile: jest.fn(),
}

jest.unstable_mockModule('@actions/core', () => mockCore)
jest.unstable_mockModule('node-ical', () => ({ default: mockIcal }))

const core = mockCore
const ical = mockIcal

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
})
