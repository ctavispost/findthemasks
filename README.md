# findthemasks
Website for findthemasks.com

new dev? please look at Issues and comment on something to grab it!

not a dev? The most useful contribution is identifying more drop off locations and plugging them into the form linked on the public website, so if you don't see an issue here that calls to you, please work on that! Advice in #131

## Current setup
 - The website reads from a google sheet, generates a json blob, which is used to generate static HTML.
 - Our data file updates every five minutes and can be read from findthemasks.com/data.json

## Embeddable widget of donation sites
- We have produced an embeddable version of our data and filters, without the call to action that's at the top of findthemasks.com. This was designed for getusppe.org on March 22, but can be reused by anyone.
- You can view it here: https://findthemasks.com/give.html
- To embed into your site, use this html snippet:

```html
<iframe style="width: 100%; height: 800px; border: none;" src="https://findthemasks.com/give.html"></iframe>
```

## Volunteer Slack
 - https://join.slack.com/t/findthemasks/shared_invite/zt-czdjjznp-p8~9oKuXtV_gn7wEBZGGoA

## Diretory structure.
  * `/public` - The client-side code for the website. Currently has some symlinks to legacy file locations.
  * `/functions` - The cloud function used to generate data.json. Not needed for frontend work.
