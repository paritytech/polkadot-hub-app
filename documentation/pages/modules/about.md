import Image from 'next/image'

# About module

## About widget

The widget shows information that is configured in [`company.json` file](../how-to/configuraiton.md): address, location directions and hub opening hours and days. The image on the widget can be replaced in the public folder in the configuration of the project. Simply add a file to `/config/public/maps/[hubID.png]`

<Image
  src="/about1.png"
  alt="about widget"
  width={150}
  height={200}
  style="margin-top: 10px;"
/>

## About page

The about page shows more information than the widget, including an interactive map, floor plans and whether desk reservations or room reservations are enabled, floor maps.

<Image src="/aboutpage1.png" alt="About page 1" width={600} height={800} />
<Image src="/aboutpage2.png" alt="About page 2" width={600} height={800} />
