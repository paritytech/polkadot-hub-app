# About module

## Manifest.json

| key                     | value           |
| ----------------------- | --------------- |
| id                      | admin-dashboard |
| name                    | Dashboard       |
| dependencies            | []              |
| requiredIntegrations    | []              |
| recommendedIntegrations | []              |

## Available Widgets

### About widget

The widget shows information that is configured in [`company.json file`](../framework/configuration/company.md):

- address

- location directions

- hub opening hours

- hub opening days

The image on the widget can be replaced in the public folder in the configuration of the project. Simply add a file to `/config/public/maps/[hubID.png]`

<Image
  src="/modules/about.png"
  alt="about widget"
  width="350"
  height="200"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

## About page

The about page shows more information than the widget, including an interactive map, floor plans and whether desk reservations or room reservations are enabled, floor maps.

<Image
  src="/modules/aboutpage1.png"
  alt="About page 1"
/>
<Image
  src="/modules/aboutpage2.png"
  alt="About page 2"
/>
