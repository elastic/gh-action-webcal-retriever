#!/bin/bash

# Script to replace date placeholders (today+N, today-N, placeholder+N, placeholder-N) with actual dates in iCalendar format

# Function to calculate date with offset
calculate_date() {
    local sign="$1"
    local days="$2"
    
    # Detect if we're on macOS (BSD date) or Linux (GNU date)
    if date --version >/dev/null 2>&1; then
        # GNU date (Linux)
        if [[ "$sign" == "+" ]]; then
            date -u -d "today +${days} days" +"%Y%m%dT%H%M%SZ"
        else
            date -u -d "today -${days} days" +"%Y%m%dT%H%M%SZ"
        fi
    else
        # BSD date (macOS)
        if [[ "$sign" == "+" ]]; then
            date -u -v+${days}d +"%Y%m%dT%H%M%SZ"
        else
            date -u -v-${days}d +"%Y%m%dT%H%M%SZ"
        fi
    fi
}

# Function to replace date placeholders with actual dates
replace_dates() {
    local input="$1"
    local output="$input"
    
    # Find all unique placeholders and replace them
    while true; do
        # Look for (today|placeholder) followed by +/- and digits
        if [[ "$output" =~ (today|placeholder)([+-][0-9]+)d? ]]; then
            local full_match="${BASH_REMATCH[0]}"
            local offset_str="${BASH_REMATCH[2]}"
            
            # Remove optional 'd' suffix if present
            offset_str="${offset_str%d}"
            
            # Extract the number and sign
            if [[ "$offset_str" =~ ([+-])([0-9]+) ]]; then
                local sign="${BASH_REMATCH[1]}"
                local days="${BASH_REMATCH[2]}"
                
                # Calculate the target date
                local target_date=$(calculate_date "$sign" "$days")
                
                # Replace all occurrences of this placeholder
                output=$(echo "$output" | sed "s/${full_match}/${target_date}/g")
            fi
        else
            # No more placeholders found
            break
        fi
    done
    
    echo "$output"
}

# Calendar template with date placeholders
CALENDAR_TEMPLATE='BEGIN:VCALENDAR
PRODID;X-RICAL-TZSOURCE=TZINFO:-//com.denhaven2/NONSGML ri_cal gem//EN
CALSCALE:GREGORIAN
VERSION:2.0
X-WR-CALNAME:On Call Schedule
BEGIN:VEVENT
DTEND;VALUE=DATE-TIME:today+1
DTSTART;VALUE=DATE-TIME:today-1
ATTENDEE:my-user@acme.com
UID:Q0D9CMF30RBLWA
SUMMARY:On Call - My User
END:VEVENT
BEGIN:VEVENT
DTEND;VALUE=DATE-TIME:today+3
DTSTART;VALUE=DATE-TIME:today+1
ATTENDEE:my-user@acme.com
UID:Q1KI14XNZ75WYE
SUMMARY:On Call - My User
END:VEVENT
END:VCALENDAR'

# Main script
replace_dates "$CALENDAR_TEMPLATE"
