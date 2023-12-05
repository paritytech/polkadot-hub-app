import config from '#client/config'
import { UserMapPin } from '../../../../../modules/users/types'

const getUserPopupHtml = (props: UserMapPin) =>
  `
  <a class="text-black bg-white hover:bg-gray-100 rounded p-1 w-[150px] block" href="${config.appHost.concat(
    '/profile/',
    props.id
  )}" target="_blank">
  <img class="block mb-2 h-[40px] w-[40px] rounded overflow-hidden" src="${
    props.avatar
  }"/>
  <p class="font-bold mb-1 leading-none text-base">${props.fullName}</p>
  <p class="m-0 text-xs text-gray-500">${props.jobTitle ?? ''}</p>
</a>
`

export const createPopup = (
  mapboxgl: any,
  map: mapboxgl.Map | null,
  e: any
) => {
  if (!map) {
    return
  }
  const coordinates = e.features[0].geometry.coordinates.slice()

  // Ensure that if the map is zoomed out such that
  // multiple copies of the feature are visible, the
  // popup appears over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
  }
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(getUserPopupHtml(e.features[0].properties))
    .addTo(map)
}
