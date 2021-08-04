# IEEE VIS Streaming
The infrastructure to support a coherent participant experience at IEEE
VIS, including watching, engaging with speakers, and socializing.

## Changelog

### August 4, 2021
* Fixed the behavior that allowed user-driven seeking within the video
  when clicking multiple times. It was due to a measure meant to prevent 
  continuous seeking for super low bandwidth. Testing found that this
  only occurs for bandwidths of less than 0.5 mbit/s for low quality
  streaming, so this is probably acceptable. Turned off this check to
  disable seeking.
* Added support for multiple simultaneous streams by adding a URL search
  query, i.e. `?session=session1`. Different sessions can have separate
  titles, videos, discord channels, and slidos.
* Added support for window resize, i.e. resizing the window will cause
  the layout to refresh and adapt.
* Added support for different stream states: `WATCHING`, `QA`, and
  `SOCIALIZING`.
  * `WATCHING` has a large YouTube player and uses the Chat tab.
  * `QA` has a large YouTube player and uses the Q&A tab.
  * `SOCIALIZING` has a small YouTube player, a large Gather.town,
    and uses the Discord tab.
* We now display the video name to the Video header on the page.