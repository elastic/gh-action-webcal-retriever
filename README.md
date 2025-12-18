# <!--name-->gh-action-webcal-retriever<!--/name-->

[![usages](https://img.shields.io/badge/usages-white?logo=githubactions&logoColor=blue)](https://github.com/search?q=gh-action-webcal-retriever+%28path%3A.github%2Fworkflows+OR+path%3A**%2Faction.yml+OR+path%3A**%2Faction.yaml%29&type=code)
[![test](https://github.com/elastic/oblt-actions/actions/workflows/test-aws-auth.yml/badge.svg?branch=main)](https://github.com/elastic/gh-action-webcal-retriever/actions/workflows/test.yml)

<!--description-->
GitHub Action that reads the attendee for current date from a webcal
<!--/description-->

## Inputs
<!--inputs-->
| Name                    | Description                                                              | Required | Default |
|-------------------------|--------------------------------------------------------------------------|----------|---------|
| `webcal_url`            | URL of the web cal                                                       | `true`   | ``      |
| `days_offset`           | positive or negative number of days to add / subtract from current date  | `false`  | `0`     |
<!--/inputs-->

## Outputs
<!--outputs-->
| Name         | Description                                                     |
|--------------|-----------------------------------------------------------------|
| `success`    | Returns true if a person could have been retrieved successfully |
| `person_id`  | File content                                                    |
| `start_date` | The start date of the period                                    |
| `end_date`   | The end date of the period                                      |
<!--/outputs-->

## Usage
<!--usage action="elastic/oblt-actions/**" version="env:VERSION"-->
```yaml
steps:
  - uses: elastic/gh-action-webcal-retriever@v1
    id: calendar
    with:
      webcal_url: 'your-calendar-url'
```
<!--/usage-->
