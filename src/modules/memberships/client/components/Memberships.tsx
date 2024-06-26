import { Header } from '#client/components/Header'
import {
  Background,
  ComponentWrapper,
  FButton,
  H1,
  H2,
  LoaderSpinner,
} from '#client/components/ui'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useMemberships } from '../queries'
import { P } from 'pino'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'

const collectionId = '658726c1-6dab-47fc-9e19-8397a0beaa89'
const makeAuthGet = (url: string) => {
  return axios.get(url, {
    headers: {
      Authorization:
        'Basic ZjkwYTJhZjYtZDZlNC00OWYyLWIxMWUtNzg3ZDkyZWQ0MGRmOlE1TGNuIzV2JUlzOA==',
    },
  })
}

export const Memberships: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { data: memberships } = useMemberships()
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)

  useEffect(() => {
    // setLoading(true)
    // makeAuthGet(`https://api.apillon.io/nfts/collections/${collectionId}`)
    //   .then((res) => {
    //     setCollection(res.data.data)
    //     console.log(res.data.data)
    //     setLoading(false)
    //     // return axios.get(
    //     //   `${res.data.data.baseUri}/1${res.data.data.baseExtension}`
    //     // )
    //     return makeAuthGet(
    //       `https://api.apillon.io/storage/buckets/${res.data.data.bucketUuid}/files`
    //     )
    //   })
    //   .then((res) => console.log(res.data.image))
    //   .catch((e) => console.log(e))
  }, [])

  return (
    <Background>
      {/* <ComponentWrapper> */}
      <H1 className="text-center">Memberships</H1>
      <H2>Location: {office.name}</H2>
      {loading && <LoaderSpinner />}
      {!loading && !!memberships?.length && (
        <div className="flex flex-row flex-wrap gap-4">
          {memberships.map((m) => {
            return (
              <div id={m.id}>
                <p className="text-md">{m.title}</p>
                <img src={m.image}></img>
                <p></p>
                <div className="flex gap-4 justify-between mt-4">
                  <FButton kind="secondary" size="small">
                    Details
                  </FButton>
                  <FButton kind="primary" size="small">
                    Buy Now
                  </FButton>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div></div>
      {/* </ComponentWrapper> */}
    </Background>
  )
}
