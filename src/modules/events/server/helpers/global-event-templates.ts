import { generateId } from '#server/utils'

export const getGlobalEventDefaultContent = (
  url: string | undefined
) => `## About the event
${
  url
    ? `To get more information about this event please visit the [event web page](${url}).`
    : 'Event web page was not added. Please use the power of Google or DuckDuckGo 💪🏼.'
}

## How to attend

- First, ask your team lead. Your team lead is responsible for approving your attendance at the event. 

- Reach out to your [team asisstant](/help/help-desks) for further guidance.

We are currently working towards streamlining the application process, ensuring seamless participation in future external events.


## Will I get registered for the event by clicking the button below?

No.

## Will clicking the button below guarantee my attendance? 

No.

## Will my flights and acommodation get magically booked after I click the button below?

No.

## Why do I want to click it then?

😎 By clicking the button below, you express your interest to participate in this event, and your name will be added to the list of potential attendees, which is visible to everyone. 


👯‍♂️ This will give you a chance to connect with other members of the community, say hello, and even plan activities together. 
`

export const getGlobalEventDefaultChecklist = () => [
  {
    id: generateId(8, 'ch_'),
    text: 'Reach out to your team leader with approval request.',
  },
  {
    id: generateId(8, 'ch_'),
    text: 'Reach out to the team assistant.',
  },
]
