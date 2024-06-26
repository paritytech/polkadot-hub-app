# NFT Membership concept

<img width="172" alt="monthly" src="https://github.com/paritytech/polkadot-hub-app/assets/2395326/2966d9d7-f6ba-4f79-b7d6-3e1ed20be624">


## Why?

- We want to promote ecosystem projects and utilize web3 technology. We will collaborate with Apillon, Talisman, Nova wallet and other projects in the ecosystem. We provide exposure, new users and help them evolve.
- This membership concept can serve as an example use case for other projects, who might consider implemeting a similar membership/login system.
- Personalized touch to the membership - people own the NFT, NFTs can have unique imagery created by each hub if they wish to add their creative touch to it.
- This concept can be developed further and gamified in the future. We can award special NFTs which can allow specific actions to their owners, etc. If the main collection is created as nestable, we can allow futher modifications to the original NFT.

## Time based Membership NFT

Each hub will decide on their own membership structure and can configure their own membership roles. Access to the member parts of the app and physical access to the hub is only possible if a member owns a "time based voucher" or an NFT with metadata defining the access.

Sample Metadata

```
expirationDate: YYYY-MM-DD
type: flexible
location: London
```

### Example:

Hub A offers:

- flexible desks
- fixed desks
- casual access.

They also offer access for 30 days, 60 days and 90 days, that they charge for.

The hub will create x different NFT collections, where each collection will represent 1 membership type.

Potential Membership collections:

```
30-days flex
60-days flex
90-days flex
30-days fixed
60-days fixed
90-days fixed
30-days casual
60-days casual
90-days casual
```

All of the collection ids of the above collections are added to the configuration of the hub. The Hub can remove/add new collections as they please.

## Member permissions

Membership NFT allows to login as a guest to any of the Polkadot Hubs. It will depend on each hub what sort of permissions will be available to guests. This can be modified in the configuration of the hub app.

## Global membership

Global member is a person who own a specific Global Membership NFT. This person has to stake a certain amount of DOT in order to support their Membership. Doing so allows them to physically access any hub of the Polkadot Hub network without purchasing any time based voucher NFTs for access.

These types of memeberships will not be freely accessible, they will be granted to certain members of the community.

## Membership purchase flow

https://www.loom.com/share/dd817a80326a462f89c151ec4f72a788?sid=41d48c15-1403-4161-b713-39dc7d21abaa
